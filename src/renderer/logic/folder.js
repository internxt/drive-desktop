import Logger from '../../libs/logger'
import Auth from './utils/Auth'
import fs from 'fs'
import path from 'path'
import electron from 'electron'
import rimraf from 'rimraf'
import Tree from './tree'
import Database from '../../database'
import async from 'async'
import analytics from './utils/analytics'
import ConfigStore from '../../main/config-store'
import state from './utils/state'
import lodash from 'lodash'
import nameTest from './utils/nameTest'
import crypt from './crypt'

const remote = require('@electron/remote')
const invalidName = /[\\/]|[. ]$/

function getTempFolderPath() {
  return path.join(remote.app.getPath('home'), '.internxt-desktop', 'tmp')
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

function create(folder) {
  fs.mkdirSync(folder.key, { recursive: true })
  if (folder.state === state.state.DOWNLOAD) {
    folder.state = state.state.SYNCED
    folder.needSync = false
    folder.nameChecked = true
  }
}
function ignore(folder) {
  folder.nameChecked = true
  folder.state = state.state.IGNORE
  folder.needSync = false
}

function createLocalFolder(select, selectIndex, folder, basePath) {
  if (folder.nameChecked) {
    create(folder)
    // return
  } else {
    const parentDir = path.dirname(folder.key)
    const parent =
      selectIndex[folder.key] !== undefined
        ? select[selectIndex[parentDir]]
        : undefined
    if (parentDir !== basePath) {
      if (!parent.nameChecked) {
        createLocalFolder(select, selectIndex, parent, basePath)
      }
      if (parent.state === state.state.IGNORE) {
        ignore(folder)
        return
      }
    }
    if (nameTest.invalidFolderName(path.basename(folder.key), basePath)) {
      ignore(folder)
    } else {
      create(folder)
    }
  }
}

async function createRemoteFolder(folders) {
  const headers = await Auth.getAuthHeader()
  return new Promise((resolve, reject) => {
    fetch(`${process.env.API_URL}/api/desktop/folders`, {
      method: 'POST',
      mode: 'cors',
      headers: headers,
      body: JSON.stringify(folders)
    })
      .then(res => {
        if (res.status !== 201) {
          throw Error('Error creating new folder', res)
        }
        return res.text()
      })
      .then(text => {
        try {
          return JSON.parse(text)
        } catch (err) {
          throw new Error(err + ' data: ' + text)
        }
      })
      .then(res => {
        analytics
          .track({
            userId: undefined,
            event: 'folder-created',
            platform: 'desktop',
            properties: {
              email: 'email'
            }
          })
          .catch(err => {
            Logger.error(err)
          })
        return resolve(res)
      })
      .catch(reject)
  })
}

async function createFolder() {
  var select = await Database.dbFind(Database.dbFolders, {})
  const user = await Database.Get('xUser')
  const basePath = await Database.Get('xPath')
  const rootId = user.user.root_folder_id
  var selectIndex = []
  let i = 0
  select.forEach(elem => {
    selectIndex[elem.key] = i++
  })

  const needUpload = []
  needUpload[basePath] = { children: [], id: rootId }
  for (const folder of select) {
    if (!folder.needSync || folder.state === state.state.IGNORE) {
      continue
    }
    if (folder.state === state.state.DOWNLOAD) {
      createLocalFolder(select, selectIndex, folder, basePath)
      continue
    }
    if (folder.state === state.state.UPLOAD) {
      if (invalidName.test(path.basename(folder.key))) {
        folder.nameChecked = true
        folder.state = state.state.IGNORE
        folder.needSync = false
        continue
      }
      folder.nameChecked = true
      const parentDir = path.dirname(folder.key)
      if (needUpload[parentDir]) {
        needUpload[parentDir].children.push(folder.key)
      } else {
        const parent = select[selectIndex[parentDir]]
        needUpload[parentDir] = {
          children: [folder.key],
          id: parent.value ? parent.value.id : undefined
        }
      }
    }
  }

  await Database.ClearFoldersSelect()
  var insertPromise = Database.dbInsert(Database.dbFolders, select)
  console.log('needUpload: ', needUpload)
  var done = false
  const maxLength = 500
  while (!done) {
    const uploadingFolders = {}
    const encryptDict = []
    const foldersUploaded = []
    let length = 0

    for (const key of Object.keys(needUpload)) {
      if (needUpload[key].id === undefined || needUpload[key].children === []) {
        continue
      }
      const parentId = needUpload[key].id
      while (needUpload[key].children.length > 0) {
        const folderOriginalKey = needUpload[key].children.shift()
        const encryptName = crypt.encryptFilename(path.basename(folderOriginalKey), parentId)
        if (uploadingFolders[parentId] === undefined) {
          uploadingFolders[parentId] = [encryptName]
        } else {
          uploadingFolders[parentId].push(encryptName)
        }
        encryptDict[encryptName] = folderOriginalKey
        if (++length === maxLength) {
          break
        }
      }
      if (needUpload[key].children.length === 0) {
        delete needUpload[key]
      }
      if (length === maxLength) {
        break
      }
    }
    if (length !== 0) {
      try {
        const res = await createRemoteFolder(uploadingFolders)
        console.log(res.length)
        for (const newFolder of res) {
          const folder = select[selectIndex[encryptDict[newFolder.name]]]
          folder.value = newFolder
          folder.state = state.state.SYNCED
          folder.needSync = false
          foldersUploaded.push(folder)
          if (needUpload[encryptDict[newFolder.name]]) {
            needUpload[encryptDict[newFolder.name]].id = newFolder.id
          }
        }
      } catch (err) {
        Logger.warn('error: ', err.message)
        continue
      }
      await insertPromise
      await Database.dbRemove(Database.dbFolders, {
        key: {
          $in: foldersUploaded.map((e) => e.key)
        }
      })
      insertPromise = Database.dbInsert(Database.dbFolders, foldersUploaded)
    } else {
      done = true
      await insertPromise
    }
  }
}
async function sincronizeCloudFolder() {
  var select = await Database.dbFind(Database.dbFolders, {})
  const user = await Database.Get('xUser')
  const basePath = await Database.Get('xPath')
  var selectIndex = []
  let i = 0
  select.forEach(elem => {
    selectIndex[elem.key] = i++
  })
  var cloud = await Database.dbFind(Database.dbFoldersCloud, {
    key: { $in: Object.keys(selectIndex) }
  })
  var cloudIndex = []
  i = 0
  cloud.forEach(elem => {
    cloudIndex[elem.key] = i++
  })
  for (const f in selectIndex) {
    var folder = select[selectIndex[f]]
    if (cloudIndex[f] === undefined) {
      folder = select[selectIndex[f]]
      folder.state = state.transition(folder.state, state.word.cloudDeleted)
    } else {
      folder.value = cloud[cloudIndex[f]].value
    }
  }
  var newFolders = select.flatMap(e => {
    if (e.value && e.value.id) {
      return { key: e.key, value: { id: e.value.id } }
    }
    return []
  })
  newFolders.push({ key: basePath, value: { id: user.user.root_folder_id } })
  var lastSyncDate = await Database.Get('lastFolderSyncDate')
  if (!lastSyncDate) {
    lastSyncDate = new Date(0)
  }
  while (newFolders.length !== 0) {
    var children = await Database.dbFind(Database.dbFoldersCloud, {
      'value.parent_id': { $in: newFolders.map(e => e.value.id) }
    })
    newFolders = lodash.differenceBy(children, newFolders, 'key')
    for (const folder of newFolders) {
      if (new Date(folder.value.created_at) >= lastSyncDate) {
        folder.needSync = true
        folder.select = true
        folder.state = state.state.DOWNLOAD
        select.push(folder)
      }
    }
  }
  console.log('despues sync cloud: ', select)
  await Database.ClearFoldersSelect()
  await Database.dbInsert(Database.dbFolders, select)
  await Database.Set('lastFolderSyncDate', new Date())
}
async function sincronizeLocalFolder() {
  const localPath = await Database.Get('xPath')
  let list = await Tree.getLocalFolderList(localPath)
  let i = 0
  const select = await Database.dbFind(Database.dbFolders, {})
  var indexDict = []
  select.forEach(elem => {
    indexDict[elem.key] = i++
  })
  for (const item of list) {
    if (ConfigStore.get('stopSync')) {
      throw Error('stop sync')
    }
    const FolderSelect = indexDict[item]
    // local exist, select not exist
    if (FolderSelect !== undefined) {
      select[FolderSelect].state = state.transition(
        select[FolderSelect].state,
        state.word.ensure
      )
    } else {
      // select and local exist
      select.push({
        key: item,
        value: null,
        needSync: true,
        select: true,
        state: state.state.UPLOAD
      })
    }
  }
  list = lodash.difference(Object.keys(indexDict), list)
  for (const item of list) {
    // select exist, local not exist
    select[indexDict[item]].state = state.transition(
      select[indexDict[item]].state,
      state.word.localDeleted
    )
    select[indexDict[item]].needSync = true
  }
  console.log('despues sync local: ', select)
  await Database.ClearFoldersSelect()
  await Database.dbInsert(Database.dbFolders, select)
}

// Delete local folders that doesn't exists on remote. [helper for deleteLocalWhenRemoteDeleted]
async function _deleteLocalWhenRemoteDeleted(lastSyncFailed) {
  const localPath = await Database.Get('xPath')
  const syncDate = Database.Get('syncStartDate')

  while (!Database.tempEmpty()) {
    await new Promise(resolve => {
      setTimeout(resolve, 1500)
    })
  }

  // Get a list of all local folders
  const list = await Tree.getLocalFolderList(localPath)
  for (const item of list) {
    if (ConfigStore.get('stopSync')) {
      throw Error('stop sync')
    }
    try {
      const folder = await Database.FolderGet(item)

      if (folder || lastSyncFailed) {
        // Folder still exists in remote, nothing to do
        await Database.TempDel(item)
        continue
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
          await new Promise((resolve, reject) => {
            rimraf(item, err => {
              Logger.info(item + ' deleted')
              if (err) {
                console.log(err)
              }
              resolve()
            })
          })
        } else {
          await Database.TempDel(item)
          continue
        }
      }
    } catch (err) {
      Logger.warn('ITEM ERR', err)
      continue
    }
  }
}

// Check folders that does not exists in local anymore, and delete those folders on remote
async function _deleteRemoteFoldersWhenLocalDeleted(lastSyncFailed) {
  if (lastSyncFailed) {
    return
  }
  const allData = Database.dbFolders.getAllData()
  for (const item of allData) {
    if (ConfigStore.get('stopSync')) {
      throw Error('stop sync')
    }
    const stat = Tree.getStat(item.key)
    if (invalidName.test(path.basename(item.key))) {
      continue
    }

    // If doesn't exists, or now is a file (was a folder before) delete from remote.
    if ((stat && stat.isFile()) || !fs.existsSync(item.key)) {
      await removeFolder(item.value.id)
      try {
        await Database.dbFolders.remove({ key: item.key })
        analytics
          .track({
            userId: undefined,
            event: 'folder-delete',
            platform: 'desktop',
            properties: {
              email: 'email',
              file_id: item.value.id
            }
          })
          .catch(err => {
            Logger.error(err)
          })
        continue
      } catch (err) {
        Logger.error('Error removing remote folder %s, %j', item.value, err)
        throw err
      }
    } /* else {
        return
      } */
  }
}

// Delete local folders missing in remote
function cleanLocalWhenRemoteDeleted(lastSyncFailed) {
  return new Promise((resolve, reject) => {
    _deleteLocalWhenRemoteDeleted(lastSyncFailed)
      .then(() => resolve())
      .catch(reject)
  })
}

// Missing folders with entry in local db
function cleanRemoteWhenLocalDeleted(lastSyncFailed) {
  return new Promise((resolve, reject) => {
    _deleteRemoteFoldersWhenLocalDeleted(lastSyncFailed)
      .then(resolve)
      .catch(reject)
  })
}

// folderId must be the CLOUD id (mysql)
// warning, this method deletes all its contents
async function removeFolder(folderId) {
  const headers = await Auth.getAuthHeader()
  return new Promise((resolve, reject) => {
    Database.Get('xUser').then(userData => {
      fetch(`${process.env.API_URL}/api/storage/folder/${folderId}`, {
        method: 'DELETE',
        headers: headers
      })
        .then(result => {
          resolve(result)
        })
        .catch(err => {
          reject(err)
        })
    })
  })
}

function rootFolderExists() {
  return new Promise((resolve, reject) => {
    Database.Get('xPath')
      .then(xPath => {
        if (!xPath) {
          resolve(false)
        }

        resolve(fs.existsSync(xPath))
      })
      .catch(reject)
  })
}

export default {
  createRemoteFolder,
  getTempFolderPath,
  createFolder,
  clearTempFolder,
  cleanLocalWhenRemoteDeleted,
  cleanRemoteWhenLocalDeleted,
  removeFolder,
  sincronizeLocalFolder,
  sincronizeCloudFolder,
  rootFolderExists
}
