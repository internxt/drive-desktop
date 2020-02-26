import { Environment } from './inxtdeps'
import fs from 'fs'
import database from '../../database/index'
import path from 'path'
import crypt from './crypt'
import axios from 'axios'
import async from 'async'
import tree from './tree'
import rimraf from 'rimraf'
import electron from 'electron'
import Logger from '../../libs/logger'

const app = electron.remote.app

async function GetAuthHeader(withMnemonic) {
  const userData = await database.Get('xUser')
  const header = { Authorization: `Bearer ${userData.token}` }
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
    } catch (err) {
      reject(err)
    }
  })
}

function GetFileModifiedDate(path) {
  return fs.statSync(path).mtime
}

function UploadFile(storj, filePath) {
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

    app.emit('set-tooltip', 'Uploading ' + originalFileName)

    // File extension
    const extSeparatorPos = originalFileName.lastIndexOf('.')
    const fileExt = originalFileName.slice(extSeparatorPos + 1)

    // File size
    const fileStats = fs.statSync(filePath)
    const fileSize = fileStats.size

    // Delete former file
    await RemoveFile(bucketId, fileId)

    const finalName = encryptedFileName + (fileExt ? '.' + fileExt : '')

    // Upload new file
    storj.storeFile(bucketId, filePath, {
      filename: finalName,
      progressCallback: function (progress, uploadedBytes, totalBytes) {
        let progressPtg = progress * 100
        progressPtg = progressPtg.toFixed(2)
        app.emit('set-tooltip', 'Uploading ' + originalFileName + ' (' + progressPtg + '%)')
      },
      finishedCallback: function (err, newFileId) {
        app.emit('set-tooltip')
        if (err) {
          Logger.error('Sync Error uploading file: %s', err)
          reject(err)
        } else {
          CreateFileEntry(bucketId, newFileId, encryptedFileName, fileExt, fileSize, folderId)
            .then(res => { resolve(res) })
            .catch(err => { reject(err) })
        }
      }
    })
  })
}

function UploadNewFile(storj, filePath) {
  const folderPath = path.dirname(filePath)
  Logger.log('NEW file found, uploading:', filePath)
  return new Promise(async (resolve, reject) => {
    const dbEntry = await database.FolderGet(folderPath)
    const user = await database.Get('xUser')
    const tree = await database.Get('tree')
    const folderRoot = await database.Get('xPath')

    if (!dbEntry || !dbEntry.value) {
      if (folderPath !== folderRoot) {
        Logger.error('Folder does not exists in local database', folderPath)
        return resolve()
      }
    }

    const bucketId = (dbEntry && dbEntry.value && dbEntry.value.bucket) || tree.bucket
    const folderId = (dbEntry && dbEntry.value && dbEntry.value.id) || user.user.root_folder_id

    Logger.log('Uploading to folder %s (bucket: %s)', folderId, bucketId)

    // Encrypted filename
    const originalFileName = path.basename(filePath)
    const encryptedFileName = crypt.EncryptFilename(originalFileName, folderId)

    app.emit('set-tooltip', 'Uploading ' + originalFileName)

    // File extension
    const extSeparatorPos = originalFileName.lastIndexOf('.')
    const fileExt = originalFileName.slice(extSeparatorPos + 1)

    // File size
    const fileStats = fs.statSync(filePath)
    const fileSize = fileStats.size

    const finalName = encryptedFileName + (fileExt ? '.' + fileExt : '')

    // Upload new file
    storj.storeFile(bucketId, filePath, {
      filename: finalName,
      progressCallback: function (progress, uploadedBytes, totalBytes) {
        let progressPtg = progress * 100
        progressPtg = progressPtg.toFixed(2)
        app.emit('set-tooltip', 'Uploading ' + originalFileName + ' (' + progressPtg + '%)')
      },
      finishedCallback: function (err, newFileId) {
        app.emit('set-tooltip')
        if (err) {
          Logger.warn('Error uploading file', err)
          // If the error is due to file existence, ignore in order to continue uploading
          const fileExistsPattern = /File already exist/
          if (fileExistsPattern.exec(err)) {
            // SHOULD RETURN THE ACTUAL FILE ID?
            Logger.warn('FILE ALREADY EXISTS')
            resolve()
          } else {
            Logger.error('Error uploading new file', err)
            reject(err)
          }
        } else {
          Logger.warn('NEW FILE ID 2', newFileId)
          CreateFileEntry(bucketId, newFileId, encryptedFileName, fileExt, fileSize, folderId)
            .then(res => resolve(res)).catch(reject)
        }
      }
    })
  })
}

// BucketId and FileId must be the NETWORK ids (mongodb)
function RemoveFile(bucketId, fileId) {
  return new Promise(async (resolve, reject) => {
    database.Get('xUser').then(userData => {
      fetch(`https://cloud.internxt.com/api/storage/bucket/${bucketId}/file/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userData.token}` }
      }).then(result => {
        resolve(result)
      }).catch(err => {
        Logger.error('Axios error removing file', err)
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
    database.Get('xUser').then(userData => {
      fetch(`https://cloud.internxt.com/api/storage/tree`, {
        headers: { Authorization: `Bearer ${userData.token}` }
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
    database.Get('xUser').then(userData => {
      fetch(`https://cloud.internxt.com/api/storage/folder/${folderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userData.token}` }
      }).then(result => {
        resolve(result)
      }).catch(err => {
        reject(err)
      })
    })
  })
}

// Create entry in X Cloud Server linked to the Bridge file
async function CreateFileEntry(bucketId, bucketEntryId, fileName, fileExtension, size, folderId) {
  const file = {
    fileId: bucketEntryId,
    name: fileName,
    type: fileExtension,
    size: size,
    folder_id: folderId,
    file_id: bucketEntryId,
    bucket: bucketId
  }

  const userData = await database.Get('xUser')

  axios.post(`https://cloud.internxt.com/api/storage/file`, { file }, {
    headers: { Authorization: `Bearer ${userData.token}` }
  }).then(() => {
  }).catch(err => {
    Logger.error('ERROR CREATE FILE ENTRY', err)
  })
}

// Check files that does not exists in local anymore
function CheckMissingFiles() {
  return new Promise((resolve, reject) => {
    let allData = database.dbFiles.getAllData()
    async.eachSeries(allData, (item, next) => {
      let stat
      try { stat = fs.lstatSync(item.key) } catch (err) { stat = null }

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

// Check folders that does not exists in local anymore
function CheckMissingFolders() {
  return new Promise((resolve, reject) => {
    let allData = database.dbFolders.getAllData()
    async.eachSeries(allData, (item, next) => {
      let stat
      try {
        stat = fs.lstatSync(item.key)
      } catch (err) {
        stat = null
      }

      if ((stat && stat.isFile()) || !fs.existsSync(item.key)) {
        RemoveFolder(item.value.id).then(() => {
          database.dbFolders.remove({ key: item.key })
          next()
        }).catch(err => {
          Logger.error('Error removing remote folder %s, %j', item.value, err)
          next(err)
        })
      } else { next() }
    }, (err, result) => {
      if (err) { reject(err) } else { resolve(result) }
    })
  })
}

// Create all remote folders on local path
function CreateLocalFolders() {
  return new Promise(async (resolve, reject) => {
    tree.GetFolderListFromRemoteTree().then(list => {
      async.eachSeries(list, (folder, next) => {
        try {
          fs.mkdirSync(folder)
          next()
        } catch (err) {
          if (err.code === 'EEXIST') {
            // Folder already exists, ignore error
            next()
          } else {
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

function CleanLocalFolders() {
  return new Promise(async (resolve, reject) => {
    const localPath = await database.Get('xPath')
    const syncDate = database.Get('syncStartDate')
    // Get a list of all local folders
    tree.GetLocalFolderList(localPath).then((list) => {
      // Check what items are in dbFolders
      async.eachSeries(list, (item, next) => {
        database.FolderGet(item).then(async folder => {
          if (folder) {
            // Folder exists in remote, nothing to do
            next()
          } else {
            // Should DELETE that folder in local
            const creationDate = fs.statSync(item)
            const isTemp = await database.TempGet(item)
            // Delete only if
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

function CleanLocalFiles() {
  return new Promise(async (resolve, reject) => {
    const localPath = await database.Get('xPath')
    // const syncDate = database.Get('syncStartDate')
    tree.GetLocalFileList(localPath).then(list => {
      async.eachSeries(list, (item, next) => {
        database.FileGet(item).then(async fileObj => {
          if (!fileObj) {
            const creationDate = fs.statSync(item)
            const isTemp = await database.TempGet(item)
            const wasDeleted = await database.dbLastFiles.findOne({ key: item })

            if (!isTemp || isTemp.value !== 'add' || wasDeleted) {
              try { fs.unlinkSync(item) } catch (e) { }
              database.TempDel(item)
            }
            next()
          } else {
            Logger.warn('FILE NOT FOUND ON REMOTE DATABASE')
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

    const userData = await database.Get('xUser')

    fetch(`https://cloud.internxt.com/api/storage/folder`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${userData.token}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(folder)
    }).then(async res => {
      return { res, data: await res.json() }
    }).then(res => {
      if (res.res.status === 500 && res.data.error && res.data.error.includes('Folder with the same name already exists')) {
        Logger.warn('Folder with the same name already exists')
        resolve()
      } else if (res.res.status === 201) {
        Logger.warn('Error creating new folder, 201')
        resolve(res.data)
      } else { reject(res.data) }
    }).catch(reject)
  })
}

export default {
  UploadFile,
  SetModifiedTime,
  GetFileModifiedDate,
  UploadNewFile,
  UpdateTree,
  CheckMissingFolders,
  CheckMissingFiles,
  CreateLocalFolders,
  RemoveFile,
  CleanLocalFolders,
  CleanLocalFiles,
  RemoteCreateFolder
}
