import { Environment } from './utils/inxtdeps'
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
import AesUtil from './utils/AesUtil'
import sanitize from 'sanitize-filename'
import BridgeService from './BridgeService'
import Auth from './utils/Auth'
import File from './File'

const app = electron.remote.app
const SYNC_KEEPALIVE_INTERVAL_MS = 25000

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
        headers: await Auth.GetAuthHeader()
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
        headers: await Auth.GetAuthHeader()
      }).then(result => {
        resolve(result)
      }).catch(err => {
        reject(err)
      })
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

function createRemoteFolder(name, parentId) {
  return new Promise(async (resolve, reject) => {
    const folder = {
      folderName: name,
      parentFolderId: parentId
    }

    const headers = await Auth.GetAuthHeader()
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
        headers: await Auth.GetAuthHeader()
      }).then(async res => {
        if (res.status !== 200) {
          throw res.statusText
        }
        try {
          return { res, data: await res.json() }
        } catch (err) {
          throw res
        }
      }).then(res => {
        console.log('THEN 2')
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

      console.log('GET 2')
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
  SetModifiedTime,
  UpdateTree,
  CheckMissingFolders,
  CreateLocalFolders,
  createRemoteFolder,
  GetOrSetUserSync,
  UpdateUserSync,
  UnlockSync,
  SYNC_KEEPALIVE_INTERVAL_MS
}
