import Tree from './tree'
import async from 'async'
import Database from '../../database/index'
import { Environment } from './inxtdeps'
import temp from 'temp'
import path from 'path'
import fs from 'fs'
import Sync from './sync'
import CheckDiskSpace from 'check-disk-space'
import electron from 'electron'
import Logger from '../../libs/logger'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'
import sanitize from 'sanitize-filename'

const app = electron.remote.app

async function _getStorjCredentials() {
  const mnemonic = await Database.Get('xMnemonic')
  const userInfo = (await Database.Get('xUser')).user

  const options = {
    bridgeUrl: 'https://api.internxt.com',
    bridgeUser: userInfo.email,
    bridgePass: userInfo.userId,
    encryptionKey: mnemonic
  }

  return options
}

function _getEnvironment() {
  return new Promise(async (resolve, reject) => {
    const options = await _getStorjCredentials()
    const storj = new Environment(options)
    resolve(storj)
  })
}

function getTempFolder() {
  return path.join(electron.remote.app.getPath('home'), '.internxt-desktop', 'tmp')
}

function DownloadFileTemp(fileObj, silent = false) {
  return new Promise(async (resolve, reject) => {
    const storj = await _getEnvironment()

    const originalFileName = path.basename(fileObj.fullpath)

    const tempPath = getTempFolder()

    if (!fs.existsSync(tempPath)) {
      mkdirp.sync(tempPath)
    }
    const tempFilePath = path.join(tempPath, fileObj.fileId + '.dat')

    Logger.log('Delete temp file', tempFilePath)
    // Delete temp file
    if (fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath) } catch (e) {
        Logger.error('Delete temp file: Cannot delete', e.message)
      }
    }

    Logger.log('DRIVE resolveFile, bucket: %s, file: %s', fileObj.bucket, fileObj.fileId)
    const state = storj.resolveFile(fileObj.bucket, fileObj.fileId, tempFilePath, {
      progressCallback: function (progress, downloadedBytes, totalBytes) {
        if (!silent) {
          let progressPtg = progress * 100
          progressPtg = progressPtg.toFixed(2)
          app.emit('set-tooltip', 'Downloading ' + originalFileName + ' (' + progressPtg + '%)')
        } else {
          app.emit('set-tooltip', 'Checking ' + originalFileName)
        }
      },
      finishedCallback: function (err) {
        app.emit('set-tooltip')
        app.removeListener('sync-stop', stopDownloadHandler)
        if (err) { reject(err) } else {
          Logger.log('Download finished')
          Sync.SetModifiedTime(tempFilePath, fileObj.created_at).then(() => resolve(tempFilePath)).catch(reject)
        }
      }
    })

    const stopDownloadHandler = (storj, state) => {
      storj.resolveFileCancel(state)
    }

    app.on('sync-stop', () => stopDownloadHandler(storj, state))
  })
}

function RestoreFile(fileObj) {
  return new Promise(async (resolve, reject) => {
    const storj = await _getEnvironment()
    Sync.UploadFile(storj, fileObj.fullpath).then(() => resolve()).catch(reject)
  })
}

// Will download ALL the files from remote
// If file already exists on local, decide if needs to be checked.
function DownloadAllFiles() {
  return new Promise((resolve, reject) => {
    // Get a list of all the files on the remote folder
    Tree.GetFileListFromRemoteTree().then(list => {
      async.eachSeries(list, async (item, next) => {
        if (path.basename(item.fullpath) !== sanitize(path.basename(item.fullpath))) {
          Logger.info('Can\'t download %s, invalid filename', path.basename(item.fullpath))
          return next()
        }
        // If not enough space on hard disk, do not download and stop syncing.
        const freeSpace = await CheckDiskSpace(path.dirname(item.fullpath))
        if (item.size * 3 >= freeSpace) { return next('No space left') }

        let downloadAndReplace = false
        let uploadAndReplace = false
        let ignoreThisFile = false

        // Check if local file exists
        const localExists = fs.existsSync(item.fullpath)

        // If local exists, replace, ensure or ignore
        if (localExists) {
          const stat = Tree.GetStat(item.fullpath)

          // "Created at" time from remote database
          const remoteTime = new Date(item.created_at)
          remoteTime.setMilliseconds(0)
          // "Modified at" from local file
          const localTime = stat.mtime
          localTime.setMilliseconds(0)

          // Warning, milliseconds are not recorded, so we set to 0 to avoid false comparisons

          if (remoteTime > localTime) {
            downloadAndReplace = true
          } else if (localTime > remoteTime) {
            uploadAndReplace = true
          }
        } else {
          // Was deleted during the sync?
          const isLocallyDeleted = await Database.TempGet(item.fullpath)

          if (isLocallyDeleted && isLocallyDeleted.value === 'unlink') {
            ignoreThisFile = true
          } else {
            downloadAndReplace = true
          }
        }

        if (ignoreThisFile) {
          try { fs.unlinkSync(item.fullpath) } catch (e) { }
          Database.TempDel(item.fullpath)
          return next()
        } else if (downloadAndReplace) {
          Logger.log('DOWNLOAD AND REPLACE WITHOUT QUESTION', item.fullpath)
          DownloadFileTemp(item).then(tempPath => {
            if (localExists) { try { fs.unlinkSync(item.fullpath) } catch (e) { } }
            // fs.renameSync gives a "EXDEV: cross-device link not permitted"
            // when application and local folder are not in the same partition
            fs.copyFileSync(tempPath, item.fullpath)
            fs.unlinkSync(tempPath)
            next(null)
          }).catch(err => {
            // On error by shard, upload again
            Logger.error(err.message)
            if (localExists) {
              Logger.error('Fatal error: Can\'t restore remote file: local is older')
            } else {
              Logger.error('Fatal error: Can\'t restore remote file: local does not exists')
            }
            next()
          })
        } else if (uploadAndReplace) {
          const storj = await _getEnvironment()
          Sync.UploadFile(storj, item.fullpath).then(() => next()).catch(next)
        } else {
          // Check if should download to ensure file
          const shouldEnsureFile = Math.floor(Math.random() * 33 + 1) % 33 === 0

          if (!shouldEnsureFile) {
            // Logger.log('%cNO ENSURE FILE', 'background-color: #aaaaff')
            return next()
          }
          Logger.log('%cENSURE FILE ' + item.filename, 'background-color: #aaaaff')
          // Check file is ok
          DownloadFileTemp(item, true).then(tempPath => next()).catch(err => {
            const isError = [
              'File missing shard error',
              'Farmer request error',
              'Memory mapped file unmap error',
              'Bridge request pointer error'
            ].find(obj => obj === err.message)

            if (isError && localExists) {
              Logger.error('%s. Reuploading...', isError)
              RestoreFile(item).then(() => next()).catch(next)
            } else {
              Logger.error('Cannot restore missing file', err.message)
              next()
            }
          })
        }
      }, (err, result) => {
        if (err) { reject(err) } else { resolve() }
      })
    }).catch(reject)
  })
}

function UploadAllNewFiles() {
  return new Promise(async (resolve, reject) => {
    const localPath = await Database.Get('xPath')
    // Get the local tree from folder (not remote or database) to check for new files.
    // The list contains the files and folders.
    const files = await Tree.GetListFromFolder(localPath)
    const storj = await _getEnvironment()

    async.eachSeries(files, async function (item, next) {
      // Read filesystem data
      const stat = Tree.GetStat(item)

      if (stat && stat.isFile() && !stat.isSymbolicLink() && stat.size < 1024 * 1024 * 1024 * 10) { // Is a file, and it is not a sym link
        // Check if file exists in the remote database
        const entry = await Database.FileGet(item)

        if (!entry) {
          // File is not present on the remote database, so it's a new file. Let's upload.
          if (stat.size === 0) {
            // The network can't hold empty files. Encryption will fail.
            // So, we will ignore this file.
            Logger.log('Warning: Filesize 0. Ignoring file.')
            return next()
          }
          // Upload file.
          Sync.UploadNewFile(storj, item).then(() => next()).catch((err) => {
            // List of unexpected errors, should re-try later
            const isError = [
              'Already exists',
              'Farmer request error'
            ].find(obj => obj.includes(err.message))

            if (isError) {
              Logger.error('Error uploading file %s, sync will retry upload in the next sync. Error: %s', item, err.message)
              Database.TempSet(item, 'add').then(() => next()).catch(() => next())
            } else {
              Logger.error('Fatal error uploading file: %s', err.message)
              next(err)
            }
          })
        } else {
          // Is not a file, so it is a dir. Do nothing.
          next()
        }
      } else {
        next()
      }
    }, (err) => {
      if (err) { reject(err) } else { resolve() }
    })
  })
}

function UploadAllNewFolders() {
  return new Promise(async (resolve, reject) => {
    const localPath = await Database.Get('xPath')
    const userInfo = await Database.Get('xUser')

    let lastParentId = null
    let lastParentFolder = null

    // Create a list with the actual local folders
    Tree.GetLocalFolderList(localPath).then(list => {
      // For each folder in local...
      async.eachSeries(list, async (item, next) => {
        // Check if folders still exists
        if (!fs.existsSync(item)) { return next() }

        const stat = Tree.GetStat(item)
        if (stat && stat.isSymbolicLink()) {
          return next()
        }
        // Check if exists in database
        const dbEntry = await Database.FolderGet(item)

        // If folder exists on remote database, ignore it, it already exists
        if (dbEntry) { return next() }

        // Subtract parent path and folder name
        const folderName = path.basename(item)
        const parentPath = path.dirname(item)

        // Get the parent folder ID from remote database
        const lastFolder = await Database.FolderGet(parentPath)
        // If parent folder exists on database, pick its ID
        const lastFolderId = lastFolder && lastFolder.value && lastFolder.value.id
        // If the parent path is the root of the target path, get the root_folder_id from user info
        let parentId = parentPath === localPath ? userInfo.user.root_folder_id : lastFolderId

        if (parentPath === lastParentFolder) {
          parentId = lastParentId
        } else if (lastParentFolder) {
          lastParentFolder = null
          lastParentId = null
        }

        if (parentId) {
          Sync.RemoteCreateFolder(folderName, parentId).then(async (result) => {
            await Database.FolderSet(item, result)
            lastParentId = result ? result.id : null
            lastParentFolder = result ? item : null
            next()
          }).catch(err => {
            Logger.error('Error creating remote folder', err)
            next(err)
          })
        } else {
          // Logger.error('Upload new folders: Undefined parent ID')
          next()
        }
      }, (err) => {
        if (err) {
          Logger.error(err)
          reject(err)
        } else {
          resolve()
        }
      })
    }).catch(reject)
  })
}

function ClearTempFolder() {
  return new Promise((resolve, reject) => {
    const tempPath = getTempFolder()

    if (!fs.existsSync(tempPath)) {
      return resolve()
    }

    rimraf(tempPath, () => resolve())
  })
}

export default {
  DownloadAllFiles,
  UploadAllNewFiles,
  UploadAllNewFolders,
  ClearTempFolder
}
