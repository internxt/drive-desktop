import { Environment } from './utils/inxtdeps'
import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'
import electron from 'electron'
import async from 'async'
import database from '../../database/index'
import crypt from './crypt'
import Logger from '../../libs/logger'
import mkdirp from 'mkdirp'
import config from '../../config'
import crypto from 'crypto'
import AesUtil from './utils/AesUtil'
import sanitize from 'sanitize-filename'
import BridgeService from './BridgeService'
import Auth from './utils/Auth'
import File from './File'
import Tree from './Tree'

const app = electron.remote.app
const SYNC_KEEPALIVE_INTERVAL_MS = 25000

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
  GetOrSetUserSync,
  UpdateUserSync,
  UnlockSync,
  SYNC_KEEPALIVE_INTERVAL_MS
}
