import path from 'path'
import fs from 'fs'
import CheckDiskSpace from 'check-disk-space'
import Logger from '../../libs/logger'
import mkdirp from 'mkdirp'
import Folder from './folder'
import getEnvironment from './utils/localuploadProcess'
import FileLogger from './FileLogger'

const { app } = require('@electron/remote')

async function downloadFileTemp(cloudFile, filePath) {
  const storj = await getEnvironment()
  const originalFileName = path.basename(filePath)

  const tempPath = Folder.getTempFolderPath()
  const freeSpace = await CheckDiskSpace(path.dirname(filePath))
  if (cloudFile.size * 3 >= freeSpace) {
    throw new Error('No space left')
  }
  if (!fs.existsSync(tempPath)) {
    mkdirp.sync(tempPath)
  }
  const tempFilePath = path.join(tempPath, cloudFile.fileId + '.dat')

  Logger.log('Delete temp file', tempFilePath)
  // Delete temp file
  if (fs.existsSync(tempFilePath)) {
    try {
      fs.unlinkSync(tempFilePath)
    } catch (e) {
      Logger.error('Delete temp file: Cannot delete', e.message)
    }
  }
  Logger.log(
    'DRIVE resolveFile, bucket: %s, file: %s',
    cloudFile.bucket,
    cloudFile.fileId
  )

  return new Promise((resolve, reject) => {
    FileLogger.push({ filePath: filePath, filename: originalFileName, action: 'download', status: 'pending' })
    const state = storj.resolveFile(
      cloudFile.bucket,
      cloudFile.fileId,
      tempFilePath,
      {
        progressCallback: function (progress, downloadedBytes, totalBytes) {
          let progressPtg = progress * 100
          progressPtg = progressPtg.toFixed(2)
          app.emit(
            'set-tooltip',
            'Downloading ' + originalFileName + ' (' + progressPtg + '%).'
          )
          FileLogger.push({ filePath: filePath, filename: originalFileName, action: 'download', progress: progressPtg })
        },
        finishedCallback: function (err) {
          app.emit('set-tooltip')
          app.removeListener('sync-stop', stopDownloadHandler)
          if (err) {
            Logger.error(`download failed, file id: ${cloudFile.fileId}`)
            // FileLogger.push(filePath, originalFileName, 'download', 'error')
            reject(err)
          } else {
            Logger.log('Download finished')
            // FileLogger.push(filePath, originalFileName, 'download', 'success')
            resolve(tempFilePath)
          }
        },
        debug: (message) => {
          try {
            Logger.warn('NODE-LIB DOWNLOAD: ' + message)
          } catch (e) {
            Logger.warn(e)
          }
        }
      }
    )

    const stopDownloadHandler = () => {
      (function (storj, state) {
        storj.resolveFileCancel(state)
      })(storj, state)
    }

    app.once('sync-stop', stopDownloadHandler)
  })
}

export default {
  downloadFileTemp
}
