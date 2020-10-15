import Logger from '../../libs/logger'
import Auth from './utils/Auth'
import Sync from './sync'
import fs from 'fs'
import path from 'path'
import electron from 'electron'
import rimraf from 'rimraf'
import Tree from './tree'
import Database from '../../database/index'
import async from 'async'

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

function getTempFolderPath() {
  return path.join(electron.remote.app.getPath('home'), '.internxt-desktop', 'tmp')
}

function clearTempFolder() {
  return new Promise((resolve, reject) => {
    const tempPath = getTempFolderPath()

    if (!fs.existsSync(tempPath)) {
      return resolve()
    }

    rimraf(tempPath, () => resolve())
  })
}

// Delete local folders that doesn't exists on remote.
function CleanLocalFolders(lastSyncFailed) {
  return new Promise(async (resolve, reject) => {
    const localPath = await Database.Get('xPath')
    const syncDate = Database.Get('syncStartDate')

    // Get a list of all local folders
    Tree.GetLocalFolderList(localPath).then((list) => {
      async.eachSeries(list, (item, next) => {
        Database.FolderGet(item).then(async folder => {
          if (folder || lastSyncFailed) {
            // Folder still exists in remote, nothing to do
            Database.TempDel(item)
            next()
          } else {
            // Should DELETE that folder in local
            const creationDate = fs.statSync(item).mtime
            creationDate.setMilliseconds(0)
            const isTemp = await Database.TempGet(item)
            // Delete only if:
            // - Was created before the sync started (nothing changed)
            // - Is not on temp Database (watcher flag)
            // - If is on watcher Database for any reason, the reason is not "just added" during sync.
            if (creationDate <= syncDate || !isTemp || isTemp.value !== 'addDir') {
              rimraf(item, (err) => next(err))
            } else {
              Database.TempDel(item)
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

export default {
  createRemoteFolder,
  getTempFolderPath,
  clearTempFolder,
  CleanLocalFolders
}
