import { Environment } from 'storj'
import Utimes from '@ronomon/utimes'
import fs from 'fs'
import database from '../../database/index'
import path from 'path'
import crypt from './crypt'
import axios from 'axios'

async function GetAuthHeader (withMnemonic) {
  const userData = JSON.parse(await database.Get('xUser'))
  const header = { Authorization: `Bearer ${userData.token}` }
  if (withMnemonic === true) {
    const mnemonic = await database.Get('xMnemonic')
    header['internxt-mnemonic'] = mnemonic.value
  }
  return header
}

function FolderInfoFromPath (localPath) {
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

function UploadFile (storj, filePath, callback) {
  return new Promise(async (resolve, reject) => {
    const fileInfo = await FolderInfoFromPath(filePath)

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

    // Delete former file
    // await RemoveFile(bucketId, fileId)

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
            .then(res => {
              resolve(res)
            })
            .catch(err => {
              reject(err)
            })
        }
      }
    })
  })
}

// BucketId and FileId must be the NETWORK ids (mongodb)
function RemoveFile (bucketId, fileId) {
  return new Promise(async (resolve, reject) => {
    const headers = await GetAuthHeader(true)
    axios.delete(`${process.env.API_URL}/storage/bucket/${bucketId}/file/${fileId}`, {
      headers: headers
    }).then(result => {
      resolve(result)
    }).catch(err => {
      reject(err)
    })
  })
}

// folderId must be the CLOUD id (mysql)
// warning, this method deletes all its contents
function RemoveFolder (folderId) {
  return new Promise(async (resolve, reject) => {
    const headers = await GetAuthHeader(true)
    axios.delete(`${process.env.API_URL}/storage/folder/${folderId}`, {
      headers: headers
    }).then(result => {
      resolve(result)
    }).catch(err => {
      reject(err)
    })
  })
}

async function CreateFileEntry (bucketId, bucketEntryId, fileName, fileExtension, size, folderId) {
  const file = {
    file: {
      bucketId: bucketEntryId,
      name: fileName,
      type: fileExtension,
      size: size,
      folder_id: folderId,
      file_id: bucketEntryId,
      bucket: bucketId
    }
  }

  const userData = JSON.parse(await database.Get('xUser'))

  axios.post(`${process.env.API_URL}/storage/file`, { file }, {
    headers: { Authorization: `Bearer ${userData.token}` }
  }).then(result => {

  }).catch(err => {
    if (err) {

    }
  })
}

export default {
  UploadFile,
  SetModifiedTime,
  GetFileModifiedDate
}
