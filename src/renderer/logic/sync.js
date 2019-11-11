import { Environment } from 'storj'
import Utimes from '@ronomon/utimes'
import fs from 'fs'
import database from '../../database/index'
import path from 'path'
import crypt from './crypt'
import axios from 'axios'
import async from 'async'
import tree from './tree'
import rimraf from 'rimraf'

async function GetAuthHeader (withMnemonic) {
  const userData = await database.Get('xUser')
  const header = { Authorization: `Bearer ${userData.token}` }
  if (withMnemonic === true) {
    const mnemonic = await database.Get('xMnemonic')
    header['internxt-mnemonic'] = mnemonic
  }
  return header
}

function FileInfoFromPath (localPath) {
  return new Promise((resolve, reject) => {
    database.dbFiles.findOne({ key: localPath }, function (err, result) {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

async function SetModifiedTime (path, time) {
  let convertedTime = ''

  const StringType = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/
  const UnixType = /^[0-9]{14}$/
  if (time.match(StringType)) {
    convertedTime = new Date(time).getTime() * 1
  }

  if (time.match(UnixType)) {
    console.log('convert time from unix')
    convertedTime = time * 1
  }

  if (time instanceof Date) {
    console.log('convert time from date')
    convertedTime = time.getTime() / 1000.0
  }

  return new Promise((resolve, reject) => {
    console.log('Set mtime for %s to %s', path, convertedTime)
    Utimes.utimes(path, undefined, convertedTime, undefined, function (err) {
      if (err) { reject(err) } else { resolve() }
    })
  })
}

function GetFileModifiedDate (path) {
  return fs.statSync(path).mtime
}

function UploadFile (storj, filePath) {
  console.log('Upload file', filePath)
  return new Promise(async (resolve, reject) => {
    const fileInfo = await FileInfoFromPath(filePath)

    // Parameters
    const bucketId = fileInfo.value.bucket
    const fileId = fileInfo.value.fileId
    const folderId = fileInfo.value.folder_id

    // Encrypted filename
    const originalFileName = path.basename(filePath)
    const encryptedFileName = crypt.EncryptFilename(originalFileName, folderId)

    // File extension
    const extSeparatorPos = originalFileName.lastIndexOf('.')
    const fileExt = originalFileName.slice(extSeparatorPos + 1)

    // File size
    const fileStats = fs.statSync(filePath)
    const fileSize = fileStats.size

    console.log('FILE SIZE', fileSize)

    // Delete former file
    await RemoveFile(bucketId, fileId)

    // Upload new file
    storj.storeFile(bucketId, filePath, {
      filename: encryptedFileName,
      progressCallback: function (progress, uploadedBytes, totalBytes) {
        console.log('Upload %s', progress)
      },
      finishedCallback: function (err, newFileId) {
        if (err) {
          console.log('Error uploading file: %s', err)
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

function UploadNewFile (storj, filePath) {
  const folderPath = path.dirname(filePath)
  console.log('Upload new file', folderPath)
  return new Promise(async (resolve, reject) => {
    const dbEntry = await database.FolderGet(folderPath)
    const user = await database.Get('xUser')
    const tree = await database.Get('tree')
    const bucketId = dbEntry.value.bucket || tree.data.bucket
    const folderId = dbEntry.value.id || user.user.root_folder_id

    // Encrypted filename
    const originalFileName = path.basename(filePath)
    const encryptedFileName = crypt.EncryptFilename(originalFileName, folderId)

    // File extension
    const extSeparatorPos = originalFileName.lastIndexOf('.')
    const fileExt = originalFileName.slice(extSeparatorPos + 1)

    // File size
    const fileStats = fs.statSync(filePath)
    const fileSize = fileStats.size

    // Upload new file
    storj.storeFile(bucketId, filePath, {
      filename: encryptedFileName,
      progressCallback: function (progress, uploadedBytes, totalBytes) {
        console.log('Upload %s', progress)
      },
      finishedCallback: function (err, newFileId) {
        if (err) {
          console.log('Error uploading new file: %s', err)
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

// BucketId and FileId must be the NETWORK ids (mongodb)
function RemoveFile (bucketId, fileId) {
  return new Promise(async (resolve, reject) => {
    const headers = await GetAuthHeader()

    axios.delete(`${process.env.API_URL}/storage/bucket/${bucketId}/file/${fileId}`, {
      headers: headers
    }).then(result => {
      resolve(result)
    }).catch(err => {
      reject(err)
    })
  })
}

function UpdateTree () {
  return new Promise((resolve, reject) => {
    GetTree().then(async (tree) => {
      await database.Set('tree', tree)
      resolve()
    }).then(err => reject(err))
  })
}

function GetTree () {
  return new Promise((resolve, reject) => {
    database.Get('xUser').then(userData => {
      fetch(`${process.env.API_URL}/storage/tree`, {
        headers: { Authorization: `Bearer ${userData.token}` }
      }).then(async res => {
        return { res, data: await res.json() }
      }).then(async res => {
        resolve(res.data)
      }).catch(err => reject(err))
    })
  })
}

// folderId must be the CLOUD id (mysql)
// warning, this method deletes all its contents
function RemoveFolder (folderId) {
  console.log('RemoveFolder(%s)', folderId)
  return new Promise(async (resolve, reject) => {
    database.Get('xUser').then(userData => {
      fetch(`${process.env.API_URL}/storage/folder/${folderId}`, {
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
async function CreateFileEntry (bucketId, bucketEntryId, fileName, fileExtension, size, folderId) {
  const file = {
    bucketId: bucketEntryId,
    name: fileName,
    type: fileExtension,
    size: size,
    folder_id: folderId,
    file_id: bucketEntryId,
    bucket: bucketId
  }

  const userData = await database.Get('xUser')

  axios.post(`${process.env.API_URL}/storage/file`, { file }, {
    headers: { Authorization: `Bearer ${userData.token}` }
  }).then(result => {
    console.log('CREATE FILE ENTRY', result)
  }).catch(err => {
    console.log('ERROR CREATE FILE ENTRY', err)
  })
}

// Check files that does not exists in local anymore
function CheckMissingFiles () {
  console.log('Checking missing files...')
  return new Promise((resolve, reject) => {
    let allData = database.dbFiles.getAllData()
    async.eachSeries(allData, (item, next) => {
      let stat
      try {
        stat = fs.lstatSync(item.key)
      } catch (err) {
        stat = null
      }

      console.log('CHECKING', item.value)

      if ((stat && !stat.isFile()) || fs.existsSync(item.key)) {
        console.log('Remove remote file', item.value)
        const bucketId = item.value.bucket
        const fileId = item.value.fileId

        RemoveFile(bucketId, fileId).then(() => next()).catch(err => {
          console.log('Error deleting remote file %j: %s', item, err)
          next()
        })
        next()
      } else {
        next()
      }
    }, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

// Check folders that does not exists in local anymore
function CheckMissingFolders () {
  console.log('Cheking missing folders')
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
        console.log('Remove remote folder %j', item.value)
        RemoveFolder(item.value.id).then(() => {
          database.dbFolders.remove({ key: item.key })
          next()
        }).catch(err => {
          console.log('Error removing remote folder %s, %j', item.value, err)
          next()
        })
      } else {
        next()
      }
    }, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

// Create all remote folders on local path
function CreateLocalFolders () {
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
            console.log('Error creating folder %s: %j', folder, err)
            next(err)
          }
        }
      }, (err, result) => {
        if (err) { reject(err) } else { resolve() }
      })
    }).catch(err => reject(err))
  })
}

function CleanLocalFolders () {
  return new Promise(async (resolve, reject) => {
    const localPath = await database.Get('xPath')
    // Get a list of all local folders
    tree.GetLocalFolderList(localPath).then((list) => {
      // Check what items are in dbFolders
      async.eachSeries(list, (item, next) => {
        database.FolderGet(item).then(folder => {
          if (folder) {
            // Folder exists in remote, nothing to do
            next()
          } else {
            // Should DELETE that folder in local
            console.log('Delete folder', item)
            rimraf(item, (err) => next(err))
          }
        }).catch(err => {
          console.log('ITEM ERR', err)
          next(err)
        })
      }, (err) => {
        console.log(database.dbFolders.getAllData())
        if (err) { reject(err) } else { resolve() }
      })
    }).catch(err => reject(err))
  })
}

function CleanLocalFiles () {
  return new Promise(async (resolve, reject) => {
    const localPath = await database.Get('xPath')
    tree.GetLocalFileList(localPath).then(list => {
      async.eachSeries(list, (item, next) => {
        database.FileGet(item).then(fileObj => {
          if (!fileObj) {
            console.log('Delete file %s', item)
            fs.unlinkSync(item)
          } else {
            next()
          }
        }).catch(err => next(err))
      }, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    }).catch(err => reject(err))
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
  CleanLocalFiles
}
