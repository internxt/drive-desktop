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
    bridgeUrl: process.env.BRIDGE_URL,
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

function _getQueue () {

}

function DownloadFileTemp (fileObj) {
  return new Promise(async (resolve, reject) => {
    const storj = await _getEnvironment()

    const tempPath = temp.dir
    const tempFilePath = path.join(tempPath, fileObj.fileId + '.dat')

    // Delete temp file
    if (fs.existsSync(tempFilePath)) { fs.unlinkSync(tempFilePath) }

    storj.resolveFile(fileObj.bucket, fileObj.fileId, tempFilePath, {
      progressCallback: function (progress, downloadedBytes, totalBytes) {
        console.log('progress:', progress)
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
          DownloadFileTemp(item)
            .then(tempPath => next())
            .catch(err => {
              if (err.message === 'File missing shard error' && localExists) {
                RestoreFile(item)
                  .then(() => next())
                  .catch(err => next(err))
              } else {
                console.error('Cannot upload local final')
                next()
              }
            })
        }
      }, (err, result) => {
        if (err) { reject(err) } else { resolve() }
      })
    }).catch(err => reject(err))
  })
}

export default {
  DownloadAllFiles
}
