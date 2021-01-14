import path from 'path'
import fs from 'fs'
import mkdirp from 'mkdirp'
import Database from '../../database'
import Logger from '../../libs/logger'
import electron from 'electron'
import crypt from './crypt'
import BridgeService from './BridgeService'
import File from './file'
import Hash from './utils/Hash'
import Tree from './tree'
import async from 'async'
import Folder from './folder'
import getEnvironment from './utils/libinxt'
import analytics from './utils/analytics'
import ConfigStore from '../../main/config-store'

const app = electron.remote.app

async function uploadNewFile(storj, filePath, nCurrent, nTotal) {
  // Get the folder info of that file.
  const folderPath = path.dirname(filePath)

  const dbEntry = await Database.FolderGet(folderPath)
  const user = await Database.Get('xUser')
  const tree = await Database.Get('tree')
  const folderRoot = await Database.Get('xPath')
  // Folder doesn't exists. We cannot upload this file yet.
  if (!dbEntry || !dbEntry.value) {
    if (folderPath !== folderRoot) {
      // Logger.error('Folder does not exists in local Database', folderPath)
      // Save this file on the temp Database, so will not be deleted in the next steps.
      await Database.TempSet(filePath, 'add')
      return
    }
  }

  Logger.log('NEW file found', filePath)

  const bucketId =
    (dbEntry && dbEntry.value && dbEntry.value.bucket) ||
    (tree && tree.bucket) ||
    user.user.bucket
  const folderId =
    (dbEntry && dbEntry.value && dbEntry.value.id) || user.user.root_folder_id

  // Encrypted filename
  const originalFileName = path.basename(filePath)
  const encryptedFileName = crypt.encryptFilename(originalFileName, folderId)

  app.emit(
    'set-tooltip',
    (nCurrent && nTotal ? `${nCurrent}/${nTotal}\n` : '') +
      'Checking ' +
      originalFileName
  )

  // File extension

  const fileNameParts = path.parse(originalFileName)
  const fileExt = fileNameParts.ext ? fileNameParts.ext.substring(1) : ''

  // File size
  const fileStats = fs.statSync(filePath)
  const fileSize = fileStats.size

  const finalName = encryptedFileName + (fileExt ? '.' + fileExt : '')

  // Copy file to temp folder
  const tempPath = path.join(
    electron.remote.app.getPath('home'),
    '.internxt-desktop',
    'tmp'
  )
  if (!fs.existsSync(tempPath)) {
    mkdirp.sync(tempPath)
  }

  const relativePath = path.relative(folderRoot, filePath)
  Logger.debug('Network name should be: %s', relativePath)
  const hashName = Hash.hasher(relativePath)
  // Double check: Prevent upload if file already exists
  const maybeNetworkId = await BridgeService.findFileByName(bucketId, hashName)
  if (maybeNetworkId) {
    return File.createFileEntry(
      bucketId,
      maybeNetworkId,
      encryptedFileName,
      fileExt,
      fileSize,
      folderId
    )
  }
  const tempFile = path.join(tempPath, hashName)
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile)
  }

  fs.copyFileSync(filePath, tempFile)

  Logger.log('Uploading to folder %s (bucket: %s)', folderId, bucketId)

  // Upload new file
  analytics
    .track({
      userId: undefined,
      event: 'file-upload-start',
      platform: 'desktop',
      properties: {
        email: 'email',
        file_size: fileSize,
        mode: ConfigStore.get('syncMode')
      }
    })
    .catch(err => {
      Logger.error(err)
    })

  return new Promise((resolve, reject) => {
    const state = storj.storeFile(bucketId, tempFile, {
      filename: hashName,
      progressCallback: function(progress, uploadedBytes, totalBytes) {
        let progressPtg = progress * 100
        progressPtg = progressPtg.toFixed(2)
        app.emit(
          'set-tooltip',
          (nCurrent && nTotal ? `Files: ${nCurrent}/${nTotal}\n` : '') +
            'Uploading ' +
            originalFileName +
            ' (' +
            progressPtg +
            '%)'
        )
      },
      finishedCallback: async function(err, newFileId) {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile)
        }
        // Clear tooltip text, the upload is finished.
        app.emit('set-tooltip')
        app.removeListener('sync-stop', stopDownloadHandler)
        if (err) {
          Logger.warn('Error uploading file', err.message)
          await Database.FileSet(filePath, null)
          // If the error is due to file existence, ignore in order to continue uploading
          const fileExistsPattern = /File already exist/
          if (fileExistsPattern.exec(err)) {
            // File already exists, so there's no need to upload again.
            Logger.warn('FILE ALREADY EXISTS', tempFile)

            // Right now file names in network are full paths encrypted.
            // This could be an issue if user uses multiple devices.
            // TODO: Migrate to relative paths based on drive folder path
            const networkId = await BridgeService.findFileByName(
              bucketId,
              hashName
            )

            if (networkId) {
              newFileId = networkId
              await File.createFileEntry(
                bucketId,
                newFileId,
                encryptedFileName,
                fileExt,
                fileSize,
                folderId
              )
                .then(res => {
                  resolve(res)
                })
                .catch(resolve)
            } else {
              Logger.warn('Cannot find file %s on network', hashName)
            }
          } else {
            // There was an error uploading the new file. Reject to stop the sync.
            Logger.error('Error uploading new file: %s', err.message)
            reject(err)
          }
        } else {
          if (!newFileId) {
            await Database.TempSet(filePath, 'add')
            Logger.error('Cannot upload file, no new id was created')
            return resolve()
          }
          Logger.warn('NEW FILE ID 2', newFileId)
          analytics
            .track({
              userId: undefined,
              event: 'file-upload-finished',
              platform: 'desktop',
              properties: {
                email: 'email',
                file_id: newFileId,
                file_size: fileSize,
                mode: ConfigStore.get('syncMode')
              }
            })
            .catch(err => {
              Logger.error(err)
            })
          await File.createFileEntry(
            bucketId,
            newFileId,
            encryptedFileName,
            fileExt,
            fileSize,
            folderId,
            fileStats.mtime
          )
            .then(resolve)
            .catch(reject)
        }
      }
    })

    const stopDownloadHandler = (storj, state) => {
      storj.storeFileCancel(state)
    }

    app.on('sync-stop', () => stopDownloadHandler(storj, state))
  })
}

async function uploadFile(storj, filePath, nCurrent, nTotal) {
  Logger.log('Upload file', filePath)

  const fileInfo = await File.fileInfoFromPath(filePath)

  // Parameters
  const bucketId = fileInfo.value.bucket
  const fileId = fileInfo.value.fileId
  const folderId = fileInfo.value.folder_id

  // Encrypted filename
  const originalFileName = path.basename(filePath)
  const encryptedFileName = crypt.encryptFilename(originalFileName, folderId)

  app.emit('set-tooltip', 'Encrypting ' + originalFileName)

  // File extension
  const fileNameParts = path.parse(originalFileName)
  const fileExt = fileNameParts.ext ? fileNameParts.ext.substring(1) : ''

  // File size
  const fileStats = fs.statSync(filePath)
  const fileMtime = fileStats.mtime
  fileMtime.setMilliseconds(0)
  const fileSize = fileStats.size

  // Delete former file
  await File.removeFile(bucketId, fileId)

  const finalName = encryptedFileName + (fileExt ? '.' + fileExt : '')

  // Copy file to temp folder
  const tempPath = path.join(
    electron.remote.app.getPath('home'),
    '.internxt-desktop',
    'tmp'
  )
  if (!fs.existsSync(tempPath)) {
    mkdirp.sync(tempPath)
  }

  const tempFile = path.join(tempPath, Hash.hasher(filePath))
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile)
  }

  fs.copyFileSync(filePath, tempFile)

  // Upload new file
  return new Promise((resolve, reject) => {
    const state = storj.storeFile(bucketId, tempFile, {
      filename: finalName,
      progressCallback: function(progress, uploadedBytes, totalBytes) {
        let progressPtg = progress * 100
        progressPtg = progressPtg.toFixed(2)
        app.emit('set-percentage', progressPtg)
        app.emit(
          'set-tooltip',
          (nCurrent && nTotal ? `Files: ${nCurrent}/${nTotal}\n` : '') +
            'Uploading ' +
            originalFileName +
            ' (' +
            progressPtg +
            '%)'
        )
      },
      finishedCallback: function(err, newFileId) {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile)
        }
        app.emit('set-tooltip')
        app.removeListener('sync-stop', stopDownloadHandler)
        if (err) {
          Logger.error('Sync Error uploading and replace file: %s', err)
          const fileExistsPattern = /File already exist/
          if (fileExistsPattern.exec(err)) {
            resolve()
          } else {
            resolve()
          }
        } else {
          File.createFileEntry(
            bucketId,
            newFileId,
            encryptedFileName,
            fileExt,
            fileSize,
            folderId,
            fileMtime
          )
            .then(res => {
              resolve(res)
            })
            .catch(err => {
              reject(err)
            })
        }
      }
    })

    const stopDownloadHandler = (storj, state) => {
      storj.storeFileCancel(state)
    }

    app.on('sync-stop', () => stopDownloadHandler(storj, state))
  })
}

async function uploadAllNewFolders() {
  const localPath = await Database.Get('xPath')
  const userInfo = await Database.Get('xUser')

  let lastParentId = null
  let lastParentFolder = null

  // Create a list with the actual local folders
  const list = await Tree.getLocalFolderList(localPath)

  // For each folder in local...
  let count = 0
  const total = list.length
  for (const item of list) {
    const stop = await Database.Get('stopSync')
    if (stop) throw stop
    // Check if folders still exists
    app.emit('set-tooltip', 'Indexing folders ' + ++count + '/' + total)
    if (!fs.existsSync(item)) {
      continue
    }
    const stat = Tree.getStat(item)
    if (stat && stat.isSymbolicLink()) {
      await Database.TempSet(item, 'addDir')
      continue
    }
    // Check if exists in Database
    const dbEntry = await Database.FolderGet(item)

    // If folder exists on remote Database, ignore it, it already exists
    if (dbEntry) {
      continue
    }

    // Subtract parent path and folder name
    const folderName = path.basename(item)
    const parentPath = path.dirname(item)

    // Get the parent folder ID from remote Database
    const lastFolder = await Database.FolderGet(parentPath)
    // If parent folder exists on Database, pick its ID
    const lastFolderId = lastFolder && lastFolder.value && lastFolder.value.id
    // If the parent path is the root of the target path, get the root_folder_id from user info
    let parentId =
      parentPath === localPath ? userInfo.user.root_folder_id : lastFolderId

    if (parentPath === lastParentFolder) {
      parentId = lastParentId
    } else if (lastParentFolder) {
      lastParentFolder = null
      lastParentId = null
    }

    if (parentId) {
      const result = await Folder.createRemoteFolder(folderName, parentId)
      await Database.FolderSet(item, result)
      lastParentId = result ? result.id : null
      lastParentFolder = result ? item : null
      // return
    } else {
      // Logger.error('Upload new folders: Undefined parent ID')
      await Database.TempSet(item, 'addDir')
    }
  }
}

async function uploadAllNewFiles() {
  const localPath = await Database.Get('xPath')
  // Get the local tree from folder (not remote or database) to check for new files.
  // The list contains the files and folders.
  const files = await Tree.getListFromFolder(localPath)
  const storj = await getEnvironment()

  const totalFiles = files.length
  let currentFiles = 0
  /*
  await async.eachSeries([1, 2, 3, 4, 5, 6], async (item, next, next2) => {
    console.log(item, next)
  })
  */
  for (const item of files) {
    currentFiles++
    const stop = await Database.Get('stopSync')
    if (stop) throw stop
    // Read filesystem data
    const stat = Tree.getStat(item)
    // Is a file, and it is not a sym link
    if (
      stat &&
      stat.isFile() &&
      !stat.isSymbolicLink() &&
      stat.size < 1024 * 1024 * 1024 * 10
    ) {
      // Check if file exists in the remote database
      const entry = await Database.FileGet(item)
      if (!entry) {
        // File is not present on the remote database, so it's a new file. Let's upload.
        if (stat.size === 0) {
          // The network can't hold empty files. Encryption will fail.
          // So, we will ignore this file.
          Logger.log('Warning: Filesize 0. Ignoring file.')
          await Database.TempSet(item, 'add')
          continue
        }
        // Upload file.
        try {
          await uploadNewFile(storj, item, currentFiles, totalFiles)
          continue
        } catch (err) {
          // List of unexpected errors, should re-try later
          const isError = [
            'Already exists',
            'Farmer request error',
            'File create parity error',
            'File encryption error'
          ].find(obj => obj.includes(err.message))
          if (isError) {
            Logger.error(
              'Error uploading file %s, sync will retry upload in the next sync. Error: %s',
              item,
              err.message
            )
            await Database.TempSet(item, 'add')
          } else {
            Logger.error('Fatal error uploading file: %s', err.message)
            throw err
          }
        }
      } else {
        // It is not new file
      }
    } else {
      // Add to Temp for don't delete it
      await Database.TempSet(item, 'add')
      // return
    }
  }
}

function uploadNewFolders() {
  return new Promise((resolve, reject) => {
    app.emit('set-tooltip', 'Indexing folders...')
    uploadAllNewFolders()
      .then(() => resolve())
      .catch(reject)
  })
}

function uploadNewFiles() {
  return new Promise((resolve, reject) => {
    app.emit('set-tooltip', 'Indexing files...')
    uploadAllNewFiles()
      .then(() => resolve())
      .catch(reject)
  })
}

export default {
  uploadNewFile,
  uploadFile,
  uploadAllNewFolders,
  uploadAllNewFiles,
  uploadNewFolders,
  uploadNewFiles
}
