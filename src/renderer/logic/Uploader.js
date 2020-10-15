import path from 'path'
import fs from 'fs'
import mkdirp from 'mkdirp'
import database from '../../database/index'
import Logger from '../../libs/logger'
import electron from 'electron'
import crypt from './crypt'
import crypto from 'crypto'
import BridgeService from './BridgeService'

const app = electron.remote.app

function hasher(input) {
  return crypto.createHash('ripemd160').update(input).digest('hex')
}

function FileInfoFromPath(localPath) {
  return new Promise((resolve, reject) => {
    database.dbFiles.findOne({ key: localPath }, function (err, result) {
      if (err) { reject(err) } else { resolve(result) }
    })
  })
}

async function GetAuthHeader(withMnemonic) {
  const userData = await database.Get('xUser')
  const header = {
    Authorization: `Bearer ${userData.token}`,
    'content-type': 'application/json; charset=utf-8'
  }
  if (withMnemonic === true) {
    const mnemonic = await database.Get('xMnemonic')
    header['internxt-mnemonic'] = mnemonic
  }
  return header
}

// BucketId and FileId must be the NETWORK ids (mongodb)
function RemoveFile(bucketId, fileId) {
  return new Promise(async (resolve, reject) => {
    database.Get('xUser').then(async userData => {
      fetch(`${process.env.API_URL}/api/storage/bucket/${bucketId}/file/${fileId}`, {
        method: 'DELETE',
        headers: await GetAuthHeader()
      }).then(result => {
        resolve(result)
      }).catch(err => {
        Logger.error('Fetch error removing file', err)
        reject(err)
      })
    })
  })
}

// This function shouldn't be here -> WIP
// Create entry in Drive Server linked to the Bridge file
async function CreateFileEntry(bucketId, bucketEntryId, fileName, fileExtension, size, folderId, date) {
  const file = {
    fileId: bucketEntryId,
    name: fileName,
    type: fileExtension,
    size: size,
    folder_id: folderId,
    file_id: bucketEntryId,
    bucket: bucketId
  }
}

function UploadNewFile(storj, filePath, nCurrent, nTotal) {
  // Get the folder info of that file.
  const folderPath = path.dirname(filePath)
  return new Promise(async (resolve, reject) => {
    const dbEntry = await database.FolderGet(folderPath)
    const user = await database.Get('xUser')
    const tree = await database.Get('tree')
    const folderRoot = await database.Get('xPath')

    // Folder doesn't exists. We cannot upload this file yet.
    if (!dbEntry || !dbEntry.value) {
      if (folderPath !== folderRoot) {
        // Logger.error('Folder does not exists in local database', folderPath)
        // Save this file on the temp database, so will not be deleted in the next steps.
        database.TempSet(filePath, 'add')
      }
      return resolve()
    }

    Logger.log('NEW file found', filePath)

    const bucketId = (dbEntry && dbEntry.value && dbEntry.value.bucket) || (tree && tree.bucket)
    const folderId = (dbEntry && dbEntry.value && dbEntry.value.id) || user.user.root_folder_id

    Logger.log('Uploading to folder %s (bucket: %s)', folderId, bucketId)

    // Encrypted filename
    const originalFileName = path.basename(filePath)
    const encryptedFileName = crypt.EncryptFilename(originalFileName, folderId)

    app.emit('set-tooltip', (nCurrent && nTotal ? `${nCurrent}/${nTotal}\n` : '') + 'Checking ' + originalFileName)

    // File extension

    const fileNameParts = path.parse(originalFileName)
    const fileExt = fileNameParts.ext ? fileNameParts.ext.substring(1) : ''

    // File size
    const fileStats = fs.statSync(filePath)
    const fileSize = fileStats.size

    const finalName = encryptedFileName + (fileExt ? '.' + fileExt : '')

    // Copy file to temp folder
    const tempPath = path.join(electron.remote.app.getPath('home'), '.internxt-desktop', 'tmp')
    if (!fs.existsSync(tempPath)) {
      mkdirp.sync(tempPath)
    }

    const hashName = hasher(filePath)
    const tempFile = path.join(tempPath, hashName)
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile)
    }

    fs.copyFileSync(filePath, tempFile)

    const relativePath = path.relative(folderRoot, filePath)
    console.log('Network name should be: %s', relativePath)

    // Upload new file
    const state = storj.storeFile(bucketId, tempFile, {
      filename: hashName,
      progressCallback: function (progress, uploadedBytes, totalBytes) {
        let progressPtg = progress * 100
        progressPtg = progressPtg.toFixed(2)
        app.emit('set-tooltip', (nCurrent && nTotal ? `Files: ${nCurrent}/${nTotal}\n` : '') + 'Uploading ' + originalFileName + ' (' + progressPtg + '%)')
      },
      finishedCallback: async function (err, newFileId) {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile)
        }
        // Clear tooltip text, the upload is finished.
        app.emit('set-tooltip')
        app.removeListener('sync-stop', stopDownloadHandler)

        if (err) {
          Logger.warn('Error uploading file', err.message)
          database.FileSet(filePath, null)
          // If the error is due to file existence, ignore in order to continue uploading
          const fileExistsPattern = /File already exist/
          if (fileExistsPattern.exec(err)) {
            // File already exists, so there's no need to upload again.
            Logger.warn('FILE ALREADY EXISTS', tempFile)

            // Right now file names in network are full paths encrypted.
            // This could be an issue if user uses multiple devices.
            // TODO: Migrate to relative paths based on drive folder path
            const networkId = await BridgeService.FindFileByName(bucketId, hashName)

            if (networkId) {
              newFileId = networkId
              CreateFileEntry(bucketId, newFileId, encryptedFileName, fileExt, fileSize, folderId).then(resolve).catch(resolve)
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
            database.TempSet(filePath, 'add')
            Logger.error('Cannot upload file, no new id was created')
            return resolve()
          }
          Logger.warn('NEW FILE ID 2', newFileId)
          CreateFileEntry(bucketId, newFileId, encryptedFileName, fileExt, fileSize, folderId, fileStats.mtime).then(resolve).catch(reject)
        }
      }
    })

    const stopDownloadHandler = (storj, state) => {
      storj.storeFileCancel(state)
    }

    app.on('sync-stop', () => stopDownloadHandler(storj, state))
  })
}

function UploadFile(storj, filePath, nCurrent, nTotal) {
  Logger.log('Upload file', filePath)
  return new Promise(async (resolve, reject) => {
    const fileInfo = await FileInfoFromPath(filePath)

    // Parameters
    const bucketId = fileInfo.value.bucket
    const fileId = fileInfo.value.fileId
    const folderId = fileInfo.value.folder_id

    // Encrypted filename
    const originalFileName = path.basename(filePath)
    const encryptedFileName = crypt.EncryptFilename(originalFileName, folderId)

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
    await RemoveFile(bucketId, fileId)

    const finalName = encryptedFileName + (fileExt ? '.' + fileExt : '')

    // Copy file to temp folder
    const tempPath = path.join(electron.remote.app.getPath('home'), '.internxt-desktop', 'tmp')
    if (!fs.existsSync(tempPath)) {
      mkdirp.sync(tempPath)
    }

    const tempFile = path.join(tempPath, hasher(filePath))
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile)
    }

    fs.copyFileSync(filePath, tempFile)

    // Upload new file
    const state = storj.storeFile(bucketId, tempFile, {
      filename: finalName,
      progressCallback: function (progress, uploadedBytes, totalBytes) {
        let progressPtg = progress * 100
        progressPtg = progressPtg.toFixed(2)
        app.emit('set-percentage', progressPtg)
        app.emit('set-tooltip', (nCurrent && nTotal ? `Files: ${nCurrent}/${nTotal}\n` : '') + 'Uploading ' + originalFileName + ' (' + progressPtg + '%)')
      },
      finishedCallback: function (err, newFileId) {
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
          CreateFileEntry(bucketId, newFileId, encryptedFileName, fileExt, fileSize, folderId, fileMtime)
            .then(res => { resolve(res) })
            .catch(err => { reject(err) })
        }
      }
    })

    const stopDownloadHandler = (storj, state) => {
      storj.storeFileCancel(state)
    }

    app.on('sync-stop', () => stopDownloadHandler(storj, state))
  })
}

export default {
  UploadNewFile,
  UploadFile
}
