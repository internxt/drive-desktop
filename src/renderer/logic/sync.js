import { Environment } from './inxtdeps'
import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'
import electron from 'electron'
import async from 'async'
import database from '../../database/index'
import crypt from './crypt'
import tree from './tree'
import Logger from '../../libs/logger'
import mkdirp from 'mkdirp'
import config from '../../config'
import crypto from 'crypto'
import AesUtil from './AesUtil'
import sanitize from 'sanitize-filename'
import BridgeService from './BridgeService'

const app = electron.remote.app
const SYNC_KEEPALIVE_INTERVAL_MS = 25000

function hasher(input) {
  return crypto.createHash('ripemd160').update(input).digest('hex')
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

function FileInfoFromPath(localPath) {
  return new Promise((resolve, reject) => {
    database.dbFiles.findOne({ key: localPath }, function (err, result) {
      if (err) { reject(err) } else { resolve(result) }
    })
  })
}

function SetModifiedTime(path, time) {
  let convertedTime = ''

  const StringType = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/
  const UnixType = /^[0-9]{14}$/

  if (time.match(StringType)) { convertedTime = new Date(time).getTime() * 1 / 1000 }
  if (time.match(UnixType)) { convertedTime = time * 1 }
  if (time instanceof Date) { convertedTime = time.getTime() / 1000.0 }

  return new Promise((resolve, reject) => {
    if (!time) { return resolve() }
    try {
      fs.utimesSync(path, convertedTime, convertedTime)
      resolve()
    } catch (err) { reject(err) }
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
        return resolve()
      }
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

function UpdateTree() {
  return new Promise((resolve, reject) => {
    GetTree().then((tree) => {
      database.Set('tree', tree).then(() => {
        resolve()
      }).catch(err => {
        reject(err)
      })
    }).catch(err => {
      Logger.error('Error updating tree', err)
      reject(err)
    })
  })
}

function GetTree() {
  return new Promise((resolve, reject) => {
    database.Get('xUser').then(async userData => {
      fetch(`${process.env.API_URL}/api/storage/tree`, {
        headers: await GetAuthHeader()
      }).then(async res => {
        return { res, data: await res.json() }
      }).then(async res => {
        resolve(res.data)
      }).catch(reject)
    })
  })
}

// folderId must be the CLOUD id (mysql)
// warning, this method deletes all its contents
function RemoveFolder(folderId) {
  return new Promise(async (resolve, reject) => {
    database.Get('xUser').then(async userData => {
      fetch(`${process.env.API_URL}/api/storage/folder/${folderId}`, {
        method: 'DELETE',
        headers: await GetAuthHeader()
      }).then(result => {
        resolve(result)
      }).catch(err => {
        reject(err)
      })
    })
  })
}

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

  try {
    AesUtil.decrypt(fileName, folderId)
    file.encrypt_version = '03-aes'
  } catch (e) {

  }

  if (date) {
    file.date = date
  }

  return new Promise(async (resolve, reject) => {
    const userData = await database.Get('xUser')

    fetch(`${process.env.API_URL}/api/storage/file`, {
      method: 'POST',
      mode: 'cors',
      headers: await GetAuthHeader(),
      body: JSON.stringify({ file })
    }).then(res => {
      resolve()
    }).catch(err => {
      Logger.log('CREATE FILE ENTRY ERROR', err)
      reject(err)
    })
  })
}

// Check files that does not exists in local anymore, and remove them from remote
function CheckMissingFiles(lastSyncFailed) {
  return new Promise((resolve, reject) => {
    if (lastSyncFailed) {
      return resolve()
    }
    const allData = database.dbFiles.getAllData()
    async.eachSeries(allData, (item, next) => {
      const stat = tree.GetStat(item.key)

      // If it doesn't exists, or it exists and now is not a file, delete from remote.
      if ((stat && !stat.isFile()) || !fs.existsSync(item.key)) {
        const bucketId = item.value.bucket
        const fileId = item.value.fileId

        RemoveFile(bucketId, fileId).then(() => next()).catch(err => {
          Logger.error('Error deleting remote file %j: %s', item, err)
          next(err)
        })
      } else {
        next()
      }
    }, (err, result) => {
      if (err) { reject(err) } else { resolve(result) }
    })
  })
}

// Check folders that does not exists in local anymore, and delete those folders on remote
function CheckMissingFolders(lastSyncFailed) {
  return new Promise((resolve, reject) => {
    if (lastSyncFailed) {
      return resolve()
    }
    const allData = database.dbFolders.getAllData()
    async.eachSeries(allData, (item, next) => {
      const stat = tree.GetStat(item.key)
      if (path.basename(item.key) !== sanitize(path.basename(item.key))) {
        return next()
      }

      // If doesn't exists, or now is a file (was a folder before) delete from remote.
      if ((stat && stat.isFile()) || !fs.existsSync(item.key)) {
        RemoveFolder(item.value.id).then(() => {
          database.dbFolders.remove({ key: item.key })
          next()
        }).catch(err => {
          Logger.error('Error removing remote folder %s, %j', item.value, err)
          next(err)
        })
      } else {
        next()
      }
    }, (err, result) => {
      if (err) { reject(err) } else { resolve(result) }
    })
  })
}

// Create all remote folders on local path
function CreateLocalFolders() {
  return new Promise(async (resolve, reject) => {
    // Get a list of all the folders on the remote tree
    tree.GetFolderListFromRemoteTree().then(list => {
      async.eachSeries(list, (folder, next) => {
        // Create the folder, doesn't matter if already exists.
        try {
          fs.mkdirSync(folder)
          next()
        } catch (err) {
          if (err.code === 'EEXIST') {
            // Folder already exists, ignore error
            next()
          } else {
            // If we cannot create the folder, we won't be able to download it's files.
            Logger.error('Error creating folder %s: %j', folder, err)
            next(err)
          }
        }
      }, (err) => {
        if (err) { reject(err) } else { resolve() }
      })
    }).catch(reject)
  })
}

// Delete local folders that doesn't exists on remote.
function CleanLocalFolders(lastSyncFailed) {
  return new Promise(async (resolve, reject) => {
    const localPath = await database.Get('xPath')
    const syncDate = database.Get('syncStartDate')

    // Get a list of all local folders
    tree.GetLocalFolderList(localPath).then((list) => {
      async.eachSeries(list, (item, next) => {
        database.FolderGet(item).then(async folder => {
          if (folder || lastSyncFailed) {
            // Folder still exists in remote, nothing to do
            database.TempDel(item)
            next()
          } else {
            // Should DELETE that folder in local
            const creationDate = fs.statSync(item).mtime
            creationDate.setMilliseconds(0)
            const isTemp = await database.TempGet(item)
            // Delete only if:
            // - Was created before the sync started (nothing changed)
            // - Is not on temp database (watcher flag)
            // - If is on watcher database for any reason, the reason is not "just added" during sync.
            if (creationDate <= syncDate || !isTemp || isTemp.value !== 'addDir') {
              rimraf(item, (err) => next(err))
            } else {
              database.TempDel(item)
              next()
            }
          }
        }).catch(err => {
          Logger.error('ITEM ERR', err)
          next(err)
        })
      }, (err) => {
        if (err) { reject(err) } else { resolve() }
      })
    }).catch(reject)
  })
}

// Delete local files that doesn't exists on remote.
// It should be called just after tree sync.
function CleanLocalFiles(lastSyncFailed) {
  return new Promise(async (resolve, reject) => {
    const localPath = await database.Get('xPath')
    const syncDate = database.Get('syncStartDate')

    // List all files in the folder
    tree.GetLocalFileList(localPath).then(list => {
      async.eachSeries(list, (item, next) => {
        database.FileGet(item).then(async fileObj => {
          if (!fileObj && !lastSyncFailed) {
            // File doesn't exists on remote database, should be locally deleted?

            const creationDate = fs.statSync(item).mtime
            creationDate.setMilliseconds(0)
            // To check if the file was added during the sync, if so, should not be deleted
            const isTemp = await database.TempGet(item)

            // Also check if the file was present in remote during the last sync
            const wasDeleted = await new Promise((resolve, reject) => {
              database.dbLastFiles.findOne({ key: item }, (err, result) => {
                if (err) { reject(err) } else { resolve(result) }
              })
            })

            // Delete if: Not in temp, not was "added" or was deleted
            if (!isTemp || isTemp.value !== 'add' || wasDeleted) {
              // TODO: Watcher will track this deletion
              try { fs.unlinkSync(item) } catch (e) { }
              database.TempDel(item)
            }
            next()
          } else {
            // File still exists on the remote database, should not be deleted
            next()
          }
        }).catch(next)
      }, (err) => {
        if (err) { reject(err) } else { resolve() }
      })
    }).catch(reject)
  })
}

function RemoteCreateFolder(name, parentId) {
  return new Promise(async (resolve, reject) => {
    const folder = {
      folderName: name,
      parentFolderId: parentId
    }

    const headers = await GetAuthHeader()
    fetch(`${process.env.API_URL}/api/storage/folder`, {
      method: 'POST',
      mode: 'cors',
      headers: headers,
      body: JSON.stringify(folder)
    }).then(async res => {
      return { res, data: await res.json() }
    }).then(res => {
      if (res.res.status === 500 && res.data.error && res.data.error.includes('Folder with the same name already exists')) {
        Logger.warn('Folder with the same name already exists')
        resolve()
      } else if (res.res.status === 201) {
        resolve(res.data)
      } else {
        Logger.error('Error creating new folder', res)
        reject(res.data)
      }
    }).catch(reject)
  })
}

function GetOrSetUserSync() {
  return new Promise(async (resolve, reject) => {
    database.Get('xUser').then(async userData => {
      fetch(`${process.env.API_URL}/api/user/sync`, {
        method: 'GET',
        headers: await GetAuthHeader()
      }).then(async res => {
        return { res, data: await res.json() }
      }).then(res => {
        resolve(res.data.data)
      }).catch(err => {
        Logger.error('Fetch error getting sync', err)
        reject(err)
      })
    })
  })
}

function UpdateUserSync(toNull = false) {
  Logger.log('Updating user sync device time')
  return new Promise(async (resolve, reject) => {
    database.Get('xUser').then(userData => {
      const fetchOpts = {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${userData.token}`,
          'content-type': 'application/json'
        },
        mode: 'cors'
      }
      if (toNull) {
        fetchOpts.body = JSON.stringify({ toNull })
      }

      fetch(`${process.env.API_URL}/api/user/sync`, fetchOpts)
        .then(async res => {
          if (res !== 200) {
            throw Error('Update sync not available on server')
          }
          return { res, data: await res.json() }
        })
        .then(res => {
          resolve(res.data.data)
        }).catch(err => {
          reject(err)
        })
    })
  })
}

async function UnlockSync() {
  Logger.info('Sync unlocked')
  return new Promise(async (resolve, reject) => {
    const userData = await database.Get('xUser')
    fetch(`${process.env.API_URL}/api/user/sync`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${userData.token}`,
        'content-type': 'application/json'
      }
    }).then(res => {
      if (res.status === 200) {
        resolve()
      } else {
        reject(res.status)
      }
    }).catch(err => {
      reject(err)
    })
  })
}

export default {
  UploadFile,
  SetModifiedTime,
  UploadNewFile,
  UpdateTree,
  CheckMissingFolders,
  CheckMissingFiles,
  CreateLocalFolders,
  RemoveFile,
  CleanLocalFolders,
  CleanLocalFiles,
  RemoteCreateFolder,
  GetOrSetUserSync,
  UpdateUserSync,
  UnlockSync,
  SYNC_KEEPALIVE_INTERVAL_MS
}
