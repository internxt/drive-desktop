import { Environment } from 'storj'
import Utimes from '@ronomon/utimes'
import fs from 'fs'

function DetermineCloudPathFromLocalPath (localPath) {
  console.log('This is the local path: %s', localPath)
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

function UploadFile (storj, bucketId, filePath) {
  return new Promise((resolve, reject) => {
    storj.storeFile(bucketId, filePath, {
      filename: 'encryptedFileName'
    })
  })
}

export default {
  IsFileAvailable,
  UploadFile,
  DetermineCloudPathFromLocalPath,
  SetModifiedTime,
  GetFileModifiedDate
}
