import path from 'path'
import fs from 'fs'
import CheckDiskSpace from 'check-disk-space'
import Logger from '../../libs/logger'
import mkdirp from 'mkdirp'
import Folder from './folder'
import getEnvironment from './utils/libinxt'
import Notification from './utils/notifications'

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
          Notification.push(filePath, originalFileName, 'download', 'inProgress', progressPtg)
        },
        finishedCallback: function (err) {
          app.emit('set-tooltip')
          app.removeListener('sync-stop', stopDownloadHandler)
          if (err) {
            Logger.error(`download failed, file id: ${cloudFile.fileId}`)
            Notification.push(filePath, originalFileName, 'download', 'error')
            reject(err)
          } else {
            Logger.log('Download finished')
            Notification.push(filePath, originalFileName, 'download', 'success')
            resolve(tempFilePath)
          }
        },
        debug: (message) => {
          try {
            // eslint-disable-next-line no-useless-escape
            if (!/[^\[]*[%$]/.test(message)) {
              Logger.warn('NODE-LIB DOWNLOAD: ' + message)
            }
          } catch (e) {
            Logger.warn(e)
          }
        }
      }
    )

    const stopDownloadHandler = (storj, state) => {
      if (storj) {
        Notification.push(filePath, originalFileName, 'download', 'canceled')
        storj.resolveFileCancel(state)
      }
    }

    app.once('sync-stop', () => stopDownloadHandler(storj, state))
  })
}

export default {
  downloadFileTemp
}
