import path from 'path'
import fs from 'fs'
import mkdirp from 'mkdirp'
import Logger from '../../libs/logger'
import BridgeService from './BridgeService'
import File from './file'
import Hash from './utils/Hash'
import getEnvironment from './utils/libinxt'

const { app } = require('@electron/remote')

/**
 *
 * @param {string} filePath
 * @param {fs.Stats} localFile
 * @param {{createdAt, updatedAt,id,fileId}} cloudFile info from server
 * @param {string} encryptedName
 * @param {string} folderRoot
 * @param {{user:{bucket} }} user
 * @param {{key:string,value:{id:Number},state:string}} folderInfo
 * @returns info from server
 */
async function uploadFile(filePath, localFile, cloudFile, encryptedName, folderRoot, user, folderInfo) {
  const storj = await getEnvironment()
  // Parameters
  const bucketId = user.user.bucket
  const fileId = cloudFile ? cloudFile.fileId : null
  const folderId = folderInfo.value.id

  // Encrypted filename
  const originalFileName = path.basename(filePath)
  const encryptedFileName = encryptedName

  app.emit('set-tooltip', 'Encrypting ' + originalFileName)

  // File extension
  const fileNameParts = path.parse(originalFileName)
  const fileExt = fileNameParts.ext ? fileNameParts.ext.substring(1) : ''

  // File size
  const fileMtime = localFile.mtime
  fileMtime.setMilliseconds(0)
  const fileSize = localFile.size
  // Delete former file
  if (cloudFile) {
    await File.removeFile(bucketId, fileId, true)
  }
  if (fileSize === 0) {
    Logger.warn('Warning:File %s, Filesize 0.', filePath)
    return
  }
  if (fileSize >= 1024 * 1024 * 1024 * 10) {
    Logger.warn('Warning:File %s, Filesize larger than 10GB.', filePath)
    return
  }
  // Copy file to temp folder
  const tempPath = path.join(app.getPath('home'), '.internxt-desktop', 'tmp')
  if (!fs.existsSync(tempPath)) {
    mkdirp.sync(tempPath)
  }
  let relativePath = path.relative(folderRoot, filePath)
  relativePath = relativePath.replace(/\\/g, '/')
  const tempFile = path.join(tempPath, Hash.hasher(relativePath))
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile)
  }

  fs.copyFileSync(filePath, tempFile)
  Logger.log('Upload file %s, size: %d', filePath, fileSize)
  // Upload new file
  return new Promise((resolve, reject) => {
    const state = storj.storeFile(bucketId, tempFile, {
      progressCallback: function (progress, uploadedBytes, totalBytes) {
        let progressPtg = progress * 100
        progressPtg = progressPtg.toFixed(2)
        app.emit(
          'set-tooltip',
          'Uploading ' +
          originalFileName +
          ' (' +
          progressPtg +
          '%)'
        )
      },
      finishedCallback: async function (err, newFileId) {
        try {
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile)
          }
          app.emit('set-tooltip')
          app.removeListener('sync-stop', stopUploadHandler)
          if (err) {
            const fileExistsPattern = /File already exist/
            let relativePath = path.relative(folderRoot, filePath)
            relativePath = relativePath.replace(/\\/g, '/')
            Logger.log('Network name should be: %s', relativePath)
            const hashName = Hash.hasher(relativePath)
            if (fileExistsPattern.exec(err)) {
              newFileId = await BridgeService.findFileByName(
                bucketId,
                hashName
              )
              if (!newFileId) {
                throw new Error(err)
              }
            } else {
              Logger.error('Sync Error uploading and replace file: %s', err)
              throw new Error(err)
            }
          }
          const fetchRes = await File.createFileEntry(
            bucketId,
            newFileId,
            encryptedFileName,
            fileExt,
            fileSize,
            folderId,
            fileMtime
          )

          const text = await fetchRes.text()
          if (fetchRes.status !== 200) {
            throw new Error(text)
          }
          const res = JSON.parse(text)
          resolve(res)
        } catch (err) {
          reject(err)
        }
      },
      debug: (message) => {
        // eslint-disable-next-line no-useless-escape
        if (!/[^\[]*[%$]/.test(message)) {
          Logger.warn('NODE-LIB UPLOAD 1: ' + message)
        }
      }
    })

    const stopUploadHandler = (storj, state) => {
      storj.storeFileCancel(state)
    }

    app.once('sync-stop', () => stopUploadHandler(storj, state))
  })
}

export default {
  uploadFile
}
