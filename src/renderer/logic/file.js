import Database from '../../database/index'
import Logger from '../../libs/logger'
import Auth from './utils/Auth'
import AesUtil from './AesUtil'
import Uploader from './uploader'
import getEnvironment from './utils/libinxt'
import Sync from './sync'
import Tree from './tree'
import fs from 'fs'
import analytics from './utils/analytics'
import ConfigStore from '../../main/config-store'
import state from './utils/state'
import lodash from 'lodash'
import path from 'path'
import downloader from './downloader'
import nameTest from './utils/nameTest'
import crypto from './crypt'
import SyncMode from './sync/NewTwoWayUpload'

const remote = require('@electron/remote')
// eslint-disable-next-line no-empty-character-class
const invalidName = /[\\/]|[. ]$|^\.[]*/
const ensure = {
  OFF: 0,
  RANDOM: 1,
  ALL: 2
}

var ensureMode = ensure.OFF

const sincronizeAction = {}
sincronizeAction[state.state.UPLOAD] = uploadState
sincronizeAction[state.state.DOWNLOAD] = downloadState
sincronizeAction[state.state.DELETE_CLOUD] = deleteCloudState
sincronizeAction[state.state.DELETE_LOCAL] = deleteLocalState

// BucketId and FileId must be the NETWORK ids (mongodb)
async function removeFile(bucketId, fileId, force = false) {
  if (SyncMode.isUploadOnly()) {
    return true
  }
  return fetch(
    `${process.env.API_URL}/api/storage/bucket/${bucketId}/file/${fileId}`,
    {
      method: 'DELETE',
      headers: await Auth.getAuthHeader()
    }
  ).then((res) => {
    return res.text()
  }).then(text => {
    return JSON.parse(text)
  }).then(result => {
    if (result.error) {
      throw new Error(result.error)
    } else {
      return result
    }
  })
}

function removeLocalFile(path) {
  if (SyncMode.isUploadOnly()) {
    throw new Error('UploadOnly')
  }
  fs.unlinkSync(path)
}

// Create entry in Drive Server linked to the Bridge file
// Create entry in Drive Server linked to the Bridge file
async function createFileEntry(
  bucketId,
  bucketEntryId,
  fileName,
  fileExtension,
  size,
  folderId,
  date
) {
  const file = {
    fileId: bucketEntryId,
    name: fileName,
    type: fileExtension,
    size: size,
    folder_id: folderId,
    file_id: bucketEntryId,
    bucket: bucketId,
    encrypt_version: '03-aes'
  }

  if (date) {
    file.date = date
  }
  const headers = await Auth.getAuthHeader()
  return new Promise((resolve, reject) => {
    fetch(`${process.env.API_URL}/api/storage/file`, {
      method: 'POST',
      mode: 'cors',
      headers: headers,
      body: JSON.stringify({ file })
    })
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        Logger.log('CREATE FILE ENTRY ERROR', err)
        reject(err)
      })
  })
}

async function removeFileEntry(
  bucketId,
  bucketEntryId,
  fileName,
  fileExtension,
  size,
  folderId,
  date
) {
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
    throw e
  }

  if (date) {
    file.date = date
  }
  const headers = await Auth.getAuthHeader()
  return new Promise((resolve, reject) => {
    fetch(`${process.env.API_URL}/api/storage/file`, {
      method: 'DELETE',
      mode: 'cors',
      headers: headers,
      body: JSON.stringify({ file })
    })
      .then(res => {
        resolve()
      })
      .catch(err => {
        Logger.log('CREATE FILE ENTRY ERROR', err)
        reject(err)
      })
  })
}

function restoreFile(fileObj) {
  return getEnvironment().then(storj => {
    return new Promise((resolve, reject) => {
      Uploader.uploadFile(storj, fileObj.fullpath)
        .then(() => resolve())
        .catch(reject)
    })
  })
}

async function sincronizeCloudFile() {
  var select = await Database.dbFind(Database.dbFiles, {})
  const user = await Database.Get('xUser')
  var selectIndex = []
  let i = 0
  select.forEach(elem => {
    selectIndex[elem.key] = i++
  })
  var cloud = await Database.dbFind(Database.dbFilesCloud, {
    key: { $in: Object.keys(selectIndex) }
  })
  var cloudIndex = []
  i = 0
  cloud.forEach(elem => {
    cloudIndex[elem.key] = i++
  })
  for (const f in selectIndex) {
    if (ConfigStore.get('stopSync')) {
      throw Error('stop sync')
    }
    var file = select[selectIndex[f]]
    if (file.state === state.state.IGNORE) {
      continue
    }
    if (cloudIndex[f] === undefined) {
      file = select[selectIndex[f]]
      file.needSync = true
      file.state = state.transition(file.state, state.word.cloudDeleted)
    } else {
      // local and select exist
      const selectTime = new Date(file.value.createdAt).setMilliseconds(0)
      const cloudFile = cloud[cloudIndex[f]]
      const cloudTime = new Date(cloudFile.value.createdAt).setMilliseconds(0)

      if (selectTime > cloudTime) {
        // select recent, upload
        file.state = state.transition(file.state, state.word.uploadAndReplace)
        file.needSync = true
        continue
      } else if (selectTime < cloudTime) {
        // cloud recent, download
        file.value = cloudFile.value
        file.state = state.transition(file.state, state.word.downloadAndReplace)
        file.needSync = true
        continue
      } else {
        file.state = state.transition(file.state, state.word.ensure)
        continue
      }
    }
  }
  var selectFolder = await Database.dbFind(Database.dbFolders, {})
  var selectFiles = Object.keys(selectIndex).map(e => {
    return { key: e }
  })
  selectFolder = selectFolder.flatMap(e => {
    if (!e.value || !e.value.id) {
      return []
    }
    return e.value.id
  })
  selectFolder.push(user.user.root_folder_id)
  var newFiles = await Database.dbFind(Database.dbFilesCloud, {
    'value.folder_id': {
      $in: selectFolder
    }
  })
  newFiles = lodash.differenceBy(newFiles, selectFiles, 'key')
  for (const f of newFiles) {
    f.state = state.state.DOWNLOAD
    f.needSync = true
    f.select = true
    select.push(f)
  }
  // console.log('despues sinc cloud: ', select)
  ConfigStore.set('updatingDB', true)
  await Database.ClearFilesSelect()
  await Database.dbInsert(Database.dbFiles, select)
  ConfigStore.set('updatingDB', false)
}

async function sincronizeLocalFile() {
  const localPath = await Database.Get('xPath')
  var list = await Tree.getLocalFileList(localPath)
  var i = 0
  var select = await Database.dbFind(Database.dbFiles, {})
  var indexDict = []
  select.forEach(elem => {
    indexDict[elem.key] = i++
  })
  for (const item of list) {
    if (ConfigStore.get('stopSync')) {
      throw Error('stop sync')
    }
    const localFile = fs.lstatSync(item)
    const FileSelect = indexDict[item]
    // local existe, select not exist
    if (FileSelect === undefined) {
      if (localFile != null) {
        const file = path.parse(item)
        select.push({
          key: item,
          value: {
            fileExt: file.ext ? file.ext.substring(1) : '',
            fileSize: localFile.size,
            createdAt: localFile.mtime,
            updatedAt: localFile.mtime
          },
          needSync: true,
          select: true,
          state: state.state.UPLOAD
        })
        continue
      }
    } else {
      // local and select exist
      const selectFile = select[FileSelect]
      const selectTime = new Date(selectFile.value.createdAt).setMilliseconds(0)
      const localTime = localFile.mtime.setMilliseconds(0)
      // console.log('selectTime: ', selectTime)
      // console.log('localTime: ', localTime)

      if (selectTime > localTime) {
        // select recent, download
        selectFile.state = state.transition(
          selectFile.state,
          state.word.downloadAndReplace
        )
        selectFile.needSync = true
        continue
      } else if (selectTime < localTime) {
        // local recent, upload
        selectFile.value.createdAt = localFile.mtime
        selectFile.state = state.transition(
          selectFile.state,
          state.word.uploadAndReplace
        )
        selectFile.needSync = true
        continue
      } else {
        selectFile.state = state.transition(selectFile.state, state.word.ensure)
        continue
      }
    }
  }
  // local not existe select exist
  list = lodash.difference(Object.keys(indexDict), list)
  for (const item of list) {
    select[indexDict[item]].state = state.transition(
      select[indexDict[item]].state,
      state.word.localDeleted
    )
    select[indexDict[item]].needSync = true
  }
  // console.log('despues sinc local: ', select)
  ConfigStore.set('updatingDB', true)
  await Database.ClearFilesSelect()
  await Database.dbInsert(Database.dbFiles, select)
  ConfigStore.set('updatingDB', false)
}

async function sincronizeFile() {
  var select = await Database.dbFind(Database.dbFiles, {})
  const rootPath = await Database.Get('xPath')
  const user = (await Database.Get('xUser'))
  for (const file of select) {
    // console.log('sincroniza: ', file)
    // console.log('state: ', file.state)
    if (ConfigStore.get('stopSync')) {
      throw Error('stop sync')
    }
    remote.app.emit('set-tooltip', `Checking file ${file.key}`)
    if (!file.select) {
      // console.log('not select')
      try {
        fs.unlink(file.key)
        await Database.dbRemoveOne(Database.dbFiles, { key: file.key })
        continue
      } catch (e) {
        Logger.error(e)
        continue
      }
    }
    let parentFolder = path.dirname(file.key)
    if (parentFolder === rootPath) {
      parentFolder = {
        key: rootPath,
        value: { id: user.user.root_folder_id },
        state: state.state.SYNCED
      }
    } else {
      parentFolder = await Database.dbFindOne(Database.dbFolders, { key: path.dirname(file.key) })
    }
    if (!file.nameChecked) {
      if (!parentFolder || parentFolder.state === state.state.IGNORE || invalidName.test(path.basename(file.key)) || nameTest.invalidFileName(path.basename(file.key), rootPath)) {
        // console.log('invalid name')
        file.state = state.state.IGNORE
        file.needSync = false
      }
      file.nameChecked = true
      await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
    }
    if (file.state === state.state.SYNCED) {
      let shouldEnsureFile = false
      if (ensureMode === ensure.OFF) {
        continue
      }
      if (ensureMode === ensure.RANDOM) {
        shouldEnsureFile = Math.floor(Math.random() * 33 + 1) % 33 === 0
      }
      if (ensureMode === ensure.ALL) {
        shouldEnsureFile = true
      }
      if (shouldEnsureFile) {
        await ensureFile(file, rootPath, user, parentFolder)
        await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
      }
      continue
    }
    if (file.state === state.state.IGNORE) {
      // console.log('IGNORE')
      continue
    }
    try {
      await sincronizeAction[file.state](file, rootPath, user, parentFolder)
    } catch (err) {
      Logger.error(err)
      continue
    }
  }
}
/**
 *
 * @param {{key, value:{createdAt: 'modifiedTime'}}} file
 * @param {fs.Stats} localFile
 * @param {{createdAt, updatedAt,id,fileId}} cloudFile info from server
 * @param {string} encryptedName
 * @param {string} rootPath
 * @param {{user:{bucket} }} user
 * @param {{key:string,value:{id:Number},state:string}} parentFolder
 */
async function uploadFile(file, localFile, cloudFile, encryptedName, rootPath, user, parentFolder) {
  try {
    remote.app.emit('set-tooltip', `Uploading file ${file.key}`)
    const newFileInfo = await Uploader.uploadFile(file.key, localFile, cloudFile, encryptedName, rootPath, user, parentFolder)
    if (newFileInfo && newFileInfo.fileId) {
      file.value = newFileInfo
      file.state = state.state.SYNCED
      file.needSync = false
    }
  } catch (err) {
    if (!/Folder not found/.test(err.message)) {
      Logger.error(`Error uploading file: ${file.key}. Error: ${err}`)
    }
  }
}

/**
 *
 * @param {{key, value:{createdAt: 'modifiedTime'}}} file
 * @param {string} rootPath
 * @param {{user:{bucket} }} user
 * @param {{key:string,value:{id:Number},state:string}} parentFolder
 */
async function ensureFile(file, rootPath, user, parentFolder) {
  try {
    remote.app.emit('set-tooltip', `Ensuring file ${file.key}`)
    const tempPath = await downloader.downloadFileTemp(file.value, file.key)
    fs.unlinkSync(tempPath)
  } catch (errDownload) {
    if (/No space left/.test(errDownload.message)) {
      return
    }
    try {
      Logger.error(`Can not download, reuploading: ${file.key}`)
      const localFile = fs.lstatSync(file.key)
      const encryptedName = file.value.name
      file.state = state.state.UPLOAD
      file.needSync = true
      const newFileInfo = await Uploader.uploadFile(file.key, localFile, file.value, encryptedName, rootPath, user, parentFolder)
      if (newFileInfo && newFileInfo.fileId) {
        file.value = newFileInfo
        file.state = state.state.SYNCED
        file.needSync = false
      }
    } catch (errUpload) {
      Logger.error(`Error uploading file: ${file.key}. Error: ${errUpload}`)
    }
  }
}

/**
*
* @param {{key, value:{createdAt: 'modifiedTime'}}} file select file
* @param {{createdAt, updatedAt,id,fileId}} cloudFile info from server
* @param {fs.Stats} localFile result of fs.lstat
*/
async function downloadFile(file, cloudFile, localFile) {
  try {
    if (SyncMode.isUploadOnly()) {
      throw new Error('UploadOnly')
    }
    remote.app.emit('set-tooltip', `Downloading file to ${file.key}`)
    analytics
      .track({
        userId: undefined,
        event: 'file-download-start',
        platform: 'desktop',
        properties: {
          email: 'email',
          file_id: cloudFile.fileId,
          file_name: cloudFile.name,
          folder_id: cloudFile.folder_id,
          file_type: cloudFile.type
        }
      })
      .catch(err => {
        Logger.error(err)
      })
    const tempPath = await downloader.downloadFileTemp(cloudFile, file.key)
    if (localFile) {
      try {
        fs.unlinkSync(file.key)
      } catch (e) {
        Logger.log(e)
      }
    }
    fs.copyFileSync(tempPath, file.key)
    fs.unlinkSync(tempPath)
    await Sync.setModifiedTime(file.key, cloudFile.createdAt)
    file.state = state.state.SYNCED
    file.value = cloudFile
    file.needSync = false
    analytics
      .track({
        userId: undefined,
        event: 'file-download-finished',
        platform: 'desktop',
        properties: {
          email: 'email',
          file_id: cloudFile.fileId,
          file_type: cloudFile.type,
          folder_id: cloudFile.folderId,
          file_name: cloudFile.name,
          file_size: cloudFile.size
        }
      })
      .catch(err => {
        Logger.error(err)
      })
  } catch (e) {
    if (/UploadOnly/.test(e.message)) {
      return
    }
    Logger.error(`Error downloading file: ${file.key}. Error: ${e}`)
  }
}

async function uploadState(file, rootPath, user, parentFolder) {
  // console.log('upload')
  // console.log(parentFolder)
  if (!parentFolder.value || !parentFolder.value.id) {
    // console.log('no parentId')
    return
  }
  const localFile = fs.existsSync(file.key) ? fs.lstatSync(file.key) : undefined
  const encryptedName = crypto.encryptFilename(path.basename(file.key), parentFolder.value.id)
  // const cloudFile = await Tree.getCloudFile(encryptedName, parentFolder.value.id)
  let cloudFile = await Database.dbFindOne(Database.dbFilesCloud, { key: file.key })
  cloudFile = cloudFile ? cloudFile.value : null
  if (cloudFile && localFile) {
    // console.log('cloud & local exist')
    const cloudTime = new Date(cloudFile.createdAt).setMilliseconds(0)
    const localTime = localFile.mtime.setMilliseconds(0)
    if (cloudTime < localTime) {
      // console.log('local recent')
      await uploadFile(file, localFile, cloudFile, encryptedName, rootPath, user, parentFolder)
      await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
      return
    }
    if (cloudTime > localTime) {
      // console.log('cloud recent')
      file.state = state.state.DOWNLOAD
      await downloadFile(file, cloudFile, localFile)
      await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
      return
    }
    if (cloudTime === localTime) {
      // console.log('same')
      file.state = state.state.SYNCED
      file.needSync = false
      file.value = cloudFile
      await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
    }
  }
  if (!cloudFile && localFile) {
    // console.log('local exist')
    await uploadFile(file, localFile, cloudFile, encryptedName, rootPath, user, parentFolder)
    await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
    return
  }
  if (cloudFile && !localFile) {
    // console.log('cloud exist')
    const cloudTime = new Date(cloudFile.createdAt).setMilliseconds(0)
    const selectTime = new Date(file.value.createdAt).setMilliseconds(0)
    if (cloudTime > selectTime) {
      // console.log('cloud recent')
      file.value = cloudFile
      file.state = state.state.DOWNLOAD
      await downloadFile(file, cloudFile, localFile)
      await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
      return
    } else {
      // console.log('select recent')
      file.state = state.state.DELETE_CLOUD
      try {
        await removeFile(cloudFile.bucket, cloudFile.fileId)
        await Database.dbRemoveOne(Database.dbFiles, { key: file.key })
        return
      } catch (e) {
        if (/UploadOnly/.test(e.message)) {
          return
        }
        Logger.error(`Error removing remote file ${file.key}. Error: ${e}`)
        await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
        return
      }
    }
  }
  if (!localFile && !cloudFile) {
    // console.log('cloud & local not exist')
    Database.dbRemoveOne(Database.dbFiles, { key: file.key })
  }
}

async function downloadState(file, rootPath, user, parentFolder) {
  if (!parentFolder.value || !parentFolder.value.id) {
    return
  }
  const localFile = fs.existsSync(file.key) ? fs.lstatSync(file.key) : undefined
  const encryptedName = crypto.encryptFilename(path.basename(file.key), parentFolder.value.id)
  // const cloudFile = await Tree.getCloudFile(encryptedName, parentFolder.value.id)
  let cloudFile = await Database.dbFindOne(Database.dbFilesCloud, { key: file.key })
  cloudFile = cloudFile ? cloudFile.value : null
  if (cloudFile && localFile) {
    const cloudTime = new Date(cloudFile.createdAt).setMilliseconds(0)
    const localTime = localFile.mtime.setMilliseconds(0)
    // console.log('download state cloudTime: ', cloudTime)
    // console.log('download state localTime: ', localTime)
    if (cloudTime < localTime) {
      file.state = state.state.UPLOAD
      file.value.createdAt = localTime
      await uploadFile(file, localFile, cloudFile, encryptedName, rootPath, user, parentFolder)
      await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
      return
    }
    if (cloudTime > localTime) {
      await downloadFile(file, cloudFile, localFile)
      await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
      return
    }
    if (cloudTime === localTime) {
      file.state = state.state.SYNCED
      file.needSync = false
      file.value = cloudFile
      await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
    }
  }
  if (!cloudFile && localFile) {
    const localTime = localFile.mtime.setMilliseconds(0)
    const selectTime = new Date(file.value.createdAt).setMilliseconds(0)
    if (localTime > selectTime) {
      file.value = cloudFile
      file.state = state.state.UPLOAD
      await uploadFile(file, localFile, cloudFile, encryptedName, rootPath, user, parentFolder)
      await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
      return
    } else {
      file.state = state.state.DELETE_LOCAL
      try {
        removeLocalFile(file.key)
        await Database.dbRemoveOne(Database.dbFiles, { key: file.key })
        return
      } catch (e) {
        if (/UploadOnly/.test(e.message)) {
          return
        }
        Logger.error(`Error removing local file ${file.key}. Error: ${e}`)
        await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
        return
      }
    }
  }
  if (cloudFile && !localFile) {
    await downloadFile(file, cloudFile, localFile)
    await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
    return
  }
  if (!localFile && !cloudFile) {
    Database.dbRemoveOne(Database.dbFiles, { key: file.key })
  }
}

async function deleteCloudState(file, rootPath, user, parentFolder) {
  if (!parentFolder.value || !parentFolder.value.id) {
    return
  }
  const localFile = fs.existsSync(file.key) ? fs.lstatSync(file.key) : undefined
  const encryptedName = crypto.encryptFilename(path.basename(file.key), parentFolder.value.id)
  // const cloudFile = await Tree.getCloudFile(encryptedName, parentFolder.value.id)
  let cloudFile = await Database.dbFindOne(Database.dbFilesCloud, { key: file.key })
  cloudFile = cloudFile ? cloudFile.value : null
  if (cloudFile && localFile) {
    const cloudTime = new Date(cloudFile.createdAt).setMilliseconds(0)
    const localTime = localFile.mtime.setMilliseconds(0)
    if (cloudTime < localTime) {
      file.state = state.state.UPLOAD
      file.value.createdAt = localTime
      await uploadFile(file, localFile, cloudFile, encryptedName, rootPath, user, parentFolder)
      await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
      return
    }
    if (cloudTime > localTime) {
      file.state = state.state.DOWNLOAD
      file.value = cloudFile
      await downloadFile(file, cloudFile, localFile)
      await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
      return
    }
    if (cloudTime === localTime) {
      file.state = state.state.SYNCED
      file.needSync = false
      file.value = cloudFile
      await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
    }
  }
  if (!cloudFile && localFile) {
    file.value = cloudFile
    file.state = state.state.UPLOAD
    await uploadFile(file, localFile, cloudFile, encryptedName, rootPath, user, parentFolder)
    await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
    return
  }
  if (cloudFile && !localFile) {
    const cloudTime = new Date(cloudFile.createdAt).setMilliseconds(0)
    const selectTime = new Date(file.value.createdAt).setMilliseconds(0)
    if (cloudTime > selectTime) {
      file.value = cloudFile
      file.state = state.state.DOWNLOAD
      await downloadFile(file, cloudFile, localFile)
      await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
      return
    } else {
      try {
        await removeFile(cloudFile.bucket, cloudFile.fileId)
        await Database.dbRemoveOne(Database.dbFiles, { key: file.key })
        return
      } catch (e) {
        if (/UploadOnly/.test(e.message)) {
          return
        }
        Logger.error(`Error removing remote file ${file.key}. Error: ${e}`)
        return
      }
    }
  }
  if (!localFile && !cloudFile) {
    Database.dbRemoveOne(Database.dbFiles, { key: file.key })
  }
}

async function deleteLocalState(file, rootPath, user, parentFolder) {
  if (!parentFolder.value || !parentFolder.value.id) {
    return
  }
  const localFile = fs.existsSync(file.key) ? fs.lstatSync(file.key) : undefined
  const encryptedName = crypto.encryptFilename(path.basename(file.key), parentFolder.value.id)
  // const cloudFile = await Tree.getCloudFile(encryptedName, parentFolder.value.id)
  let cloudFile = await Database.dbFindOne(Database.dbFilesCloud, { key: file.key })
  cloudFile = cloudFile ? cloudFile.value : null
  if (cloudFile && localFile) {
    const cloudTime = new Date(cloudFile.createdAt).setMilliseconds(0)
    const localTime = localFile.mtime.setMilliseconds(0)
    if (cloudTime < localTime) {
      file.state = state.state.UPLOAD
      file.value.createdAt = localTime
      await uploadFile(file, localFile, cloudFile, encryptedName, rootPath, user, parentFolder)
      await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
      return
    }
    if (cloudTime > localTime) {
      file.state = state.state.DOWNLOAD
      file.value = cloudFile
      await downloadFile(file, cloudFile, localFile)
      await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
      return
    }
    if (cloudTime === localTime) {
      file.state = state.state.SYNCED
      file.needSync = false
      file.value = cloudFile
      await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
    }
  }
  if (!cloudFile && localFile) {
    const localTime = localFile.mtime.setMilliseconds(0)
    const selectTime = new Date(file.value.createdAt).setMilliseconds(0)
    if (localTime > selectTime) {
      file.value = cloudFile
      file.state = state.state.UPLOAD
      await uploadFile(file, localFile, cloudFile, encryptedName, rootPath, user, parentFolder)
      await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
      return
    } else {
      try {
        removeLocalFile(file.key)
        await Database.dbRemoveOne(Database.dbFiles, { key: file.key })
        return
      } catch (e) {
        if (/UploadOnly/.test(e.message)) {
          return
        }
        Logger.error(`Error removing local file ${file.key}. Error: ${e}`)
        return
      }
    }
  }
  if (cloudFile && !localFile) {
    await downloadFile(file, cloudFile, localFile)
    await Database.dbUpdate(Database.dbFiles, { key: file.key }, { $set: file })
    return
  }
  if (!localFile && !cloudFile) {
    Database.dbRemoveOne(Database.dbFiles, { key: file.key })
  }
}

function setEnsureMode(mode) {
  ensureMode = mode
}

export default {
  removeFile,
  createFileEntry,
  sincronizeLocalFile,
  sincronizeCloudFile,
  restoreFile,
  removeFileEntry,
  sincronizeFile,
  setEnsureMode
}
