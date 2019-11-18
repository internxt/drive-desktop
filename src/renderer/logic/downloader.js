import Tree from './tree'
import async from 'async'
import Database from '../../database/index'
import { Environment } from 'storj'
import temp from 'temp'
import path from 'path'
import fs from 'fs'
import Sync from './sync'

async function _getStorjCredentials () {
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

function _getEnvironment () {
  return new Promise(async (resolve, reject) => {
    const options = await _getStorjCredentials()
    const storj = new Environment(options)
    resolve(storj)
  })
}

function DownloadFileTemp (fileObj, silent = false) {
  return new Promise(async (resolve, reject) => {
    const storj = await _getEnvironment()

    const tempPath = temp.dir
    const tempFilePath = path.join(tempPath, fileObj.fileId + '.dat')

    // Delete temp file
    if (fs.existsSync(tempFilePath)) { fs.unlinkSync(tempFilePath) }

    storj.resolveFile(fileObj.bucket, fileObj.fileId, tempFilePath, {
      progressCallback: function (progress, downloadedBytes, totalBytes) {
        if (!silent) {
          console.log('progress:', progress)
        }
      },
      finishedCallback: function (err) {
        if (err) { reject(err) } else {
          Sync.SetModifiedTime(tempFilePath, fileObj.created_at)
            .then(() => resolve(tempFilePath))
            .catch(err => reject(err))
        }
      }
    })
  })
}

function RestoreFile (fileObj) {
  return new Promise(async (resolve, reject) => {
    const storj = await _getEnvironment()
    const bucketId = fileObj.bucket
    const fileId = fileObj.folder_id

    Sync.UploadFile(storj, fileObj.fullpath).then(() => resolve()).catch(err => reject(err))
  })
}

function DownloadAllFiles () {
  return new Promise((resolve, reject) => {
    Tree.GetFileListFromRemoteTree().then(list => {
      async.eachSeries(list, (item, next) => {
        console.log('Cheking ', item.fullpath)
        let downloadAndReplace = false

        const localExists = fs.existsSync(item.fullpath)

        if (localExists) {
          const stat = fs.lstatSync(item.fullpath)

          const remoteTime = new Date(item.created_at)
          const localTime = stat.mtime

          if (localTime > remoteTime) { downloadAndReplace = true }
        } else {
          downloadAndReplace = true
        }

        if (downloadAndReplace) {
          console.log('DOWNLOAD AND REPLACE WITHOUT QUESTION')
          DownloadFileTemp(item).then(tempPath => {
            if (localExists) { fs.unlinkSync(item.fullpath) }
            fs.renameSync(tempPath, item.fullpath)
            next(null)
          }).catch(err => {
            // On error by shard, upload again
            console.log(err)
            if (localExists) {
              console.error('Fatal error: Cant restore remote file: local is older')
            } else {
              console.error('Fatal error: Cant restore remote file: local does not exists')
            }
            next()
          })
        } else {
          console.log('DOWNLOAD JUST TO ENSURE FILE')
          // Check file is ok
          DownloadFileTemp(item, true)
            .then(tempPath => next())
            .catch(err => {
              if (err.message === 'File missing shard error' && localExists) {
                console.error('Missing shard error. Reuploading...')
                RestoreFile(item)
                  .then(() => next())
                  .catch(err => next(err))
              } else {
                console.error('Cannot upload local final')
                next(err)
              }
            })
        }
      }, (err, result) => {
        if (err) { reject(err) } else { resolve() }
      })
    }).catch(err => reject(err))
  })
}

function UploadAllNewFiles () {
  return new Promise(async (resolve, reject) => {
    const localPath = await Database.Get('xPath')
    const arbol = Tree.GetListFromFolder(localPath)
    const storj = await _getEnvironment()

    async.eachSeries(arbol, async function (item, next) {
      var stat = Tree.GetStat(item)

      if (stat.isFile()) {
        // Is a file
        let entry = await Database.FileGet(item)
        if (!entry) {
          // File only exists in local
          console.log('New local file:', item)
          Sync.UploadNewFile(storj, item).then(() => next()).catch(err => next(err))
        } else { next() }
      } else {
        // Is a folder
        let entry = await Database.FolderGet(item)
        if (!entry) {
          // Is a NEW folder
          console.log('New local folder:', item)
          next()
        } else {
          next()
        }
      }
    }, (err, result) => {
      if (err) {
        console.error('Error uploading file', err)
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

function UploadAllNewFolders () {
  return new Promise(async (resolve, reject) => {
    const localPath = await Database.Get('xPath')
    const userInfo = await Database.Get('xUser')

    let lastParentId = null
    let lastParentFolder = null

    Tree.GetLocalFolderList(localPath).then(list => {
      async.eachSeries(list, async (item, next) => {
        // Check if exists in database
        const dbEntry = await Database.FolderGet(item)

        if (dbEntry) { return next() }

        // Substract local path
        const folderName = path.basename(item)
        const parentPath = path.dirname(item)

        let parentId = parentPath === localPath ? userInfo.user.root_folder_id : (await Database.FolderGet(parentPath)).value.id
        if (parentPath === lastParentFolder) {
          parentId = lastParentId
        } else if (lastParentFolder) {
          lastParentFolder = null
          lastParentId = null
        }

        if (parentId) {
          Sync.RemoteCreateFolder(folderName, parentId).then(async (result) => {
            console.log('Remote create folder result', result)
            await Database.FolderSet(item, result)
            lastParentId = result ? result.id : null
            lastParentFolder = result ? item : null
            next()
          }).catch(err => next(err))
        } else {
          next()
        }
      }, (err) => {
        if (err) {
          console.error(err)
          reject(err)
        } else { resolve() }
      })
    }).catch(err => reject(err))
  })
}

export default {
  DownloadAllFiles,
  UploadAllNewFiles,
  UploadAllNewFolders
}
