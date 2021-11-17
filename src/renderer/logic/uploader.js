import path from 'path'
import fs from 'fs'
import mkdirp from 'mkdirp'
import Logger from '../../libs/logger'
import BridgeService from './BridgeService'
import File from './file'
import Hash from './utils/Hash'
import getEnvironment from './utils/localuploadProcess'
import FileLogger from './FileLogger'

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
async function uploadFile(
  filePath,
  localFile,
  cloudFile,
  encryptedName,
  folderRoot,
  user,
  folderInfo
) {
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
    await File.removeFile(bucketId, fileId, filePath, true)
  }
  if (fileSize === 0) {
    // Lanzar errores sustituyendo return y quitar notificacion
    // FileLogger.push({ filePath, originalFileName, state: 'error', de'Empty files upload not supported.' })
    Logger.warn('Warning:File %s, Filesize 0.', filePath)
    throw new Error(`Warning:File ${filePath}, Filesize 0.`)
  }
  if (fileSize >= 1024 * 1024 * 1024 * 10) {
    // Lanzar errores sustituyendo return y quitar notificacion
    // FileLogger.push(filePath, originalFileName, 'upload', 'error', undefined, 'Upload of files larger than 10GB not supported.')
    Logger.warn('Warning:File %s, Filesize larger than 10GB.', filePath)
    throw new Error(`Warning:File ${filePath}, Filesize larger than 10GB.`)
  }
  // Copy file to temp folder
  const tempPath = path.join(
    app.getPath('userData'),
    '.internxt-desktop',
    'tmp'
  )
  if (!fs.existsSync(tempPath)) {
    mkdirp.sync(tempPath)
  }
  let relativePath = path.relative(folderRoot, filePath)
  relativePath = relativePath.replace(/\\/g, '/')
  const tempFile = path.join(tempPath, Hash.hasher(relativePath))
  const hashName = Hash.hasher(relativePath)
  const alreadyExists = await BridgeService.findFileByName(bucketId, hashName)
  if (alreadyExists) {
    await BridgeService.deleteFile(bucketId, alreadyExists)
  }
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile)
  }

  fs.copyFileSync(filePath, tempFile)
  Logger.log('Upload file %s, size: %d', filePath, fileSize)

  // Upload new file
  return new Promise((resolve, reject) => {
    FileLogger.push({
      filePath: filePath,
      filename: originalFileName,
      action: 'encrypt',
      date: Date()
    })
    const state = storj.storeFile(bucketId, tempFile, {
      progressCallback: function(progress, uploadedBytes, totalBytes) {
        let progressPtg = progress * 100
        progressPtg = progressPtg.toFixed(2)
        app.emit(
          'set-tooltip',
          'Uploading ' + originalFileName + ' (' + progressPtg + '%)'
        )
        FileLogger.push({
          filePath,
          filename: originalFileName,
          action: 'upload',
          progress: progressPtg,
          date: Date()
        })
      },
      finishedCallback: async function(err, newFileId) {
        let text
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
              newFileId = await BridgeService.findFileByName(bucketId, hashName)
              if (!newFileId) {
                // FileLogger.push({filePath, originalFileName, state: 'error'})
                throw new Error(err)
              }
            } else {
              Logger.error('Sync Error uploading and replace file: %s', err)
              // FileLogger.push({filePath, originalFileName, state: 'error'})
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

          text = await fetchRes.text()
          if (fetchRes.status !== 200) {
            // FileLogger.push({filePath, originalFileName, state: 'error'})
            throw new Error(text)
          }
          const res = JSON.parse(text)
          // FileLogger.push({filePath, originalFileName, 'success'})
          resolve(res)
        } catch (err) {
          if (text !== undefined) {
            reject(new Error(`${err} with text: ${text}`))
          } else {
            reject(err)
          }
        }
      },
      debug: message => {
        // eslint-disable-next-line no-useless-escape
        if (!/[^\[]*[%$]/.test(message)) {
          Logger.warn('NODE-LIB UPLOAD 1: ' + message)
        }
      }
    })

    const stopUploadHandler = () => {
      ;(function(storj, state) {
        storj.storeFileCancel(state)
      })(storj, state)
    }

    app.once('sync-stop', stopUploadHandler)
  })
}

export default {
  uploadFile
}
