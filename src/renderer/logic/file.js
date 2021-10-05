import Database from '../../database/index'
import Logger from '../../libs/logger'
import Auth from './utils/Auth'
import AesUtil from './AesUtil'
import Uploader from './uploader'
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
import FileLogger from './FileLogger'
import Spaceusage from './utils/spaceusage'

const remote = require('@electron/remote')
// eslint-disable-next-line no-empty-character-class
const invalidName = /[\\/]|[. ]$|^\.[]*/
const ensure = {
  OFF: 0,
  RANDOM: 1,
  ALL: 2
}

var ensureMode = ensure.OFF
var ensureProbability

const sincronizeAction = {}
sincronizeAction[state.state.UPLOAD] = uploadState
sincronizeAction[state.state.DOWNLOAD] = downloadState
sincronizeAction[state.state.DELETE_CLOUD] = deleteCloudState
sincronizeAction[state.state.DELETE_LOCAL] = deleteLocalState
sincronizeAction[state.state.DELETEIGNORE] = deleteIgnoreState
// BucketId and FileId must be the NETWORK ids (mongodb)
async function removeFile(bucketId, fileId, filename, force = false) {
  if (force) {
    // Notificate.replace (updating)
    Logger.log(
      `Removing cloud file: ${filename}. file id: ${fileId} for replace`
    )
  } else {
    if (SyncMode.isUploadOnly()) {
      return true
    }
    Logger.log(`Removing cloud file: ${filename}. file id: ${fileId}`)
  }
  const result = await fetch(
    `${process.env.API_URL}/api/storage/bucket/${bucketId}/file/${fileId}`,
    {
      method: 'DELETE',
      headers: await Auth.getAuthHeader()
    }
  )
    .then(res => {
      return res.text()
    })
    .then(text => {
      return JSON.parse(text)
    })
  if (result.error) {
    // Notificate.error delete cloud
    FileLogger.push({
      filePath: filename,
      action: 'remove',
      state: 'error',
      description: result.error.message,
      date: Date()
    })
    throw new Error(result.error)
  } else {
    if (!force) {
      FileLogger.push({
        filePath: filename,
        filename: path.basename(filename),
        action: 'remove',
        state: 'success',
        date: Date()
      })
    }

    return result
  }
}

function removeLocalFile(path) {
  if (SyncMode.isUploadOnly()) {
    throw new Error('UploadOnly')
  }
  Logger.log(`Removing local file: ${path}.`)
  // Notificate.delete local (start)

  try {
    fs.unlinkSync(path)
    // Notificate.delete local (succ)
  } catch (e) {
    if (/no such file or directory/.test(e.message)) {
      // Notificate.delete local (succ)
      return
    }
    // Notificate.delete local (err)
    throw e
  }
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
  ConfigStore.set('updatingDB', true)
  await Database.ClearFilesSelect()
  await Database.dbInsert(Database.dbFiles, select)
  ConfigStore.set('updatingDB', false)
}

async function sincronizeFile() {
  var select = await Database.dbFind(Database.dbFiles, {})
  const rootPath = await Database.Get('xPath')
  const user = await Database.Get('xUser')
  const total = await Database.dbCount(Database.dbFiles, { needSync: true })
  let now = 0
  for (const file of select) {
    if (ConfigStore.get('stopSync')) {
      throw Error('stop sync')
    }
    if (file.needSync) {
      now++
    }
    remote.app.emit('set-tooltip', `Checking file ${file.key}`)
    if (!file.select) {
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
      parentFolder = await Database.dbFindOne(Database.dbFolders, {
        key: path.dirname(file.key)
      })
    }
    if (!file.nameChecked) {
      if (!parentFolder || state.ignoredState.includes(parentFolder.state)) {
        file.state = parentFolder.state
        file.needSync = false
      } else if (
        invalidName.test(path.basename(file.key)) ||
        nameTest.invalidFileName(path.basename(file.key), rootPath)
      ) {
        file.state = state.state.IGNORELOCALNOTEXISTS
        file.needSync = false
      }
      if (parentFolder && parentFolder.nameChecked) {
        file.nameChecked = true
      }
      await Database.dbUpdate(
        Database.dbFiles,
        { key: file.key },
        { $set: file }
      )
    }
    if (file.state === state.state.SYNCED) {
      let shouldEnsureFile = false
      if (ensureMode === ensure.OFF) {
        continue
      }
      if (ensureMode === ensure.RANDOM) {
        shouldEnsureFile = Math.random() < ensureProbability
      }
      if (ensureMode === ensure.ALL) {
        shouldEnsureFile = true
      }
      if (shouldEnsureFile) {
        await ensureFile(file, rootPath, user, parentFolder)
        await Database.dbUpdate(
          Database.dbFiles,
          { key: file.key },
          { $set: file }
        )
      }
      continue
    }
    if (state.ignoredState.includes(file.state)) {
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
async function uploadFile(
  file,
  localFile,
  cloudFile,
  encryptedName,
  rootPath,
  user,
  parentFolder
) {
  try {
    remote.app.emit('set-tooltip', `Uploading file ${file.key}`)
    FileLogger.push({
      filePath: file.key,
      filename: path.basename(file.key),
      action: 'upload'
    })

    analytics.trackUploadStarted({
      type: file.value.fileExt,
      size: file.value.fileSize,
      item_type: 'file'
    })
    let timeToUpload = new Date()
    const newFileInfo = await Uploader.uploadFile(
      file.key,
      localFile,
      cloudFile,
      encryptedName,
      rootPath,
      user,
      parentFolder
    )
    timeToUpload = new Date() - timeToUpload
    if (newFileInfo && newFileInfo.fileId) {
      file.value = newFileInfo
      file.state = state.state.SYNCED
      file.needSync = false
    }
    Spaceusage.updateUsage(file.size)
    analytics.trackUploadCompleted({
      type: file.value.fileExt,
      size: file.value.fileSize,
      item_type: 'file',
      time_to_upload: timeToUpload
    })
    // FileLogger.upload success
    FileLogger.push({
      filePath: file.key,
      filename: path.basename(file.key),
      action: 'upload',
      state: 'success',
      date: Date()
    })
  } catch (err) {
    if (!/Folder not found/.test(err.message)) {
      Logger.error(`Error uploading file: ${file.key}. Error: ${err}`)
    }

    analytics.trackUploadError({
      type: file.value.fileExt,
      size: file.value.fileSize,
      error_id: null,
      message: err.message,
      item_type: 'file'
    })
    // FileLogger.error
    FileLogger.push({
      filePath: file.key,
      filename: path.basename(file.key),
      action: 'upload',
      state: 'error',
      description: err.message,
      date: Date()
    })
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
    Logger.log(`Ensure file ${file.key}.`)
    // Notificate.ensure download
    FileLogger.push()
    const tempPath = await downloader.downloadFileTemp(file.value, file.key)
    fs.unlinkSync(tempPath)
    // Notficate.ensure.success
  } catch (errDownload) {
    if (
      /No space left/.test(errDownload.message) ||
      /process killed by user/.test(errDownload.message)
    ) {
      return
    }
    try {
      Logger.error(`Can not download, reuploading: ${file.key}`)
      // FileLogger.ensure upload
      const localFile = fs.lstatSync(file.key)
      const encryptedName = file.value.name
      file.state = state.state.UPLOAD
      file.needSync = true
      const newFileInfo = await Uploader.uploadFile(
        file.key,
        localFile,
        file.value,
        encryptedName,
        rootPath,
        user,
        parentFolder
      )
      if (newFileInfo && newFileInfo.fileId) {
        file.value = newFileInfo
        file.state = state.state.SYNCED
        file.needSync = false
      }
      // FileLogger.ensure.success
    } catch (errUpload) {
      // FileLogger.ensure.error upload
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

    analytics.trackDownloadStarted({
      type: cloudFile.type,
      folder_id: cloudFile.folder_id,
      file_id: cloudFile.fileId,
      item_type: 'file',
      size: cloudFile.size
    })
    let timeToDownload = new Date()
    const tempPath = await downloader.downloadFileTemp(cloudFile, file.key)
    FileLogger.push({
      filePath: file.key,
      action: 'download',
      state: 'success'
    })
    if (localFile) {
      try {
        fs.unlinkSync(file.key)
      } catch (e) {
        Logger.log(e)
      }
    }
    try {
      fs.copyFileSync(tempPath, file.key)
    } catch (err) {
      if (/no such file or directory/.test(err.message)) {
        fs.mkdirSync(path.dirname(file.key), { recursive: true })
      }
      fs.copyFileSync(tempPath, file.key)
    }
    fs.unlinkSync(tempPath)
    await Sync.setModifiedTime(file.key, cloudFile.createdAt)
    file.state = state.state.SYNCED
    file.value = cloudFile
    file.needSync = false

    timeToDownload = new Date() - timeToDownload
    analytics.trackDownloadCompleted({
      file_id: cloudFile.fileId,
      type: cloudFile.type,
      folder_id: cloudFile.folderId,
      size: cloudFile.size,
      item_type: 'file',
      time_to_download: timeToDownload
    })
  } catch (e) {
    if (/UploadOnly/.test(e.message)) {
      return
    }
    analytics.trackDownloadError({
      file_id: cloudFile.fileId,
      error_id: null,
      type: cloudFile.type,
      size: cloudFile.size,
      message: e.message,
      item_type: 'file'
    })
    // FileLogger.download.error (normal)
    FileLogger.push({
      filePath: file.key,
      filename: path.basename(file.key),
      action: 'download', // not really needed
      state: 'error',
      date: Date()
      // description: e.message
    })
    Logger.error(`Error downloading file: ${file.key}. Error: ${e}`)
  }
}

async function uploadState(file, rootPath, user, parentFolder) {
  if (!parentFolder || !parentFolder.value || !parentFolder.value.id) {
    return
  }
  const localFile = fs.existsSync(file.key) ? fs.lstatSync(file.key) : undefined
  const encryptedName = crypto.encryptFilename(
    path.basename(file.key),
    parentFolder.value.id
  )
  // const cloudFile = await Tree.getCloudFile(encryptedName, parentFolder.value.id)
  let cloudFile = await Database.dbFindOne(Database.dbFilesCloud, {
    key: file.key
  })
  cloudFile = cloudFile ? cloudFile.value : null
  if (cloudFile && localFile) {
    const cloudTime = new Date(cloudFile.createdAt).setMilliseconds(0)
    const localTime = localFile.mtime.setMilliseconds(0)
    if (cloudTime < localTime) {
      await uploadFile(
        file,
        localFile,
        cloudFile,
        encryptedName,
        rootPath,
        user,
        parentFolder
      )
      await Database.dbUpdate(
        Database.dbFiles,
        { key: file.key },
        { $set: file }
      )
      return
    }
    if (cloudTime > localTime) {
      file.state = state.state.DOWNLOAD
      await downloadFile(file, cloudFile, localFile)
      await Database.dbUpdate(
        Database.dbFiles,
        { key: file.key },
        { $set: file }
      )
      return
    }
    if (cloudTime === localTime) {
      file.state = state.state.SYNCED
      file.needSync = false
      file.value = cloudFile
      await Database.dbUpdate(
        Database.dbFiles,
        { key: file.key },
        { $set: file }
      )
    }
  }
  if (!cloudFile && localFile) {
    await uploadFile(
      file,
      localFile,
      cloudFile,
      encryptedName,
      rootPath,
      user,
      parentFolder
    )
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
      await Database.dbUpdate(
        Database.dbFiles,
        { key: file.key },
        { $set: file }
      )
      return
    } else {
      file.state = state.state.DELETE_CLOUD
      try {
        await removeFile(cloudFile.bucket, cloudFile.fileId, file.key)
        // When implement trash may delete next line
        Spaceusage.updateUsage(file.size)
        await Database.dbRemoveOne(Database.dbFiles, { key: file.key })
        return
      } catch (e) {
        if (/UploadOnly/.test(e.message)) {
          return
        }
        Logger.error(`Error removing remote file ${file.key}. Error: ${e}`)
        await Database.dbUpdate(
          Database.dbFiles,
          { key: file.key },
          { $set: file }
        )
        return
      }
    }
  }
  if (!localFile && !cloudFile) {
    Database.dbRemoveOne(Database.dbFiles, { key: file.key })
  }
}
async function deleteIgnoreState(file, rootPath, user, parentFolder) {
  await Database.dbRemoveOne(Database.dbFiles, { key: file.key })
}
async function downloadState(file, rootPath, user, parentFolder) {
  if (!parentFolder || !parentFolder.value || !parentFolder.value.id) {
    return
  }
  const localFile = fs.existsSync(file.key) ? fs.lstatSync(file.key) : undefined
  const encryptedName = crypto.encryptFilename(
    path.basename(file.key),
    parentFolder.value.id
  )
  // const cloudFile = await Tree.getCloudFile(encryptedName, parentFolder.value.id)
  let cloudFile = await Database.dbFindOne(Database.dbFilesCloud, {
    key: file.key
  })
  cloudFile = cloudFile ? cloudFile.value : null
  if (cloudFile && localFile) {
    const cloudTime = new Date(cloudFile.createdAt).setMilliseconds(0)
    const localTime = localFile.mtime.setMilliseconds(0)
    if (cloudTime < localTime) {
      file.state = state.state.UPLOAD
      file.value.createdAt = localTime
      await uploadFile(
        file,
        localFile,
        cloudFile,
        encryptedName,
        rootPath,
        user,
        parentFolder
      )
      await Database.dbUpdate(
        Database.dbFiles,
        { key: file.key },
        { $set: file }
      )
      return
    }
    if (cloudTime > localTime) {
      await downloadFile(file, cloudFile, localFile)
      await Database.dbUpdate(
        Database.dbFiles,
        { key: file.key },
        { $set: file }
      )
      return
    }
    if (cloudTime === localTime) {
      file.state = state.state.SYNCED
      file.needSync = false
      file.value = cloudFile
      await Database.dbUpdate(
        Database.dbFiles,
        { key: file.key },
        { $set: file }
      )
    }
  }
  if (!cloudFile && localFile) {
    const localTime = localFile.mtime.setMilliseconds(0)
    const selectTime = new Date(file.value.createdAt).setMilliseconds(0)
    if (localTime > selectTime) {
      file.value = cloudFile
      file.state = state.state.UPLOAD
      await uploadFile(
        file,
        localFile,
        cloudFile,
        encryptedName,
        rootPath,
        user,
        parentFolder
      )
      await Database.dbUpdate(
        Database.dbFiles,
        { key: file.key },
        { $set: file }
      )
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
        await Database.dbUpdate(
          Database.dbFiles,
          { key: file.key },
          { $set: file }
        )
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
  let encryptedName
  if (parentFolder && parentFolder.value && !parentFolder.value.id) {
    encryptedName = crypto.encryptFilename(
      path.basename(file.key),
      parentFolder.value.id
    )
  }
  const localFile = fs.existsSync(file.key) ? fs.lstatSync(file.key) : undefined
  // const cloudFile = await Tree.getCloudFile(encryptedName, parentFolder.value.id)
  let cloudFile = await Database.dbFindOne(Database.dbFilesCloud, {
    key: file.key
  })
  cloudFile = cloudFile ? cloudFile.value : null
  if (cloudFile && localFile) {
    const cloudTime = new Date(cloudFile.createdAt).setMilliseconds(0)
    const localTime = localFile.mtime.setMilliseconds(0)
    if (cloudTime < localTime) {
      file.state = state.state.UPLOAD
      file.value.createdAt = localTime
      await uploadFile(
        file,
        localFile,
        cloudFile,
        encryptedName,
        rootPath,
        user,
        parentFolder
      )
      await Database.dbUpdate(
        Database.dbFiles,
        { key: file.key },
        { $set: file }
      )
      return
    }
    if (cloudTime > localTime) {
      file.state = state.state.DOWNLOAD
      file.value = cloudFile
      await downloadFile(file, cloudFile, localFile)
      await Database.dbUpdate(
        Database.dbFiles,
        { key: file.key },
        { $set: file }
      )
      return
    }
    if (cloudTime === localTime) {
      file.state = state.state.SYNCED
      file.needSync = false
      file.value = cloudFile
      await Database.dbUpdate(
        Database.dbFiles,
        { key: file.key },
        { $set: file }
      )
    }
  }
  if (!cloudFile && localFile) {
    file.value = cloudFile
    file.state = state.state.UPLOAD
    await uploadFile(
      file,
      localFile,
      cloudFile,
      encryptedName,
      rootPath,
      user,
      parentFolder
    )
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
      await Database.dbUpdate(
        Database.dbFiles,
        { key: file.key },
        { $set: file }
      )
      return
    } else {
      try {
        await removeFile(cloudFile.bucket, cloudFile.fileId, file.key)
        // When implement trash may delete next line
        Spaceusage.updateUsage(file.size)
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
  let encryptedName
  if (parentFolder && parentFolder.value && !parentFolder.value.id) {
    encryptedName = crypto.encryptFilename(
      path.basename(file.key),
      parentFolder.value.id
    )
  }
  const localFile = fs.existsSync(file.key) ? fs.lstatSync(file.key) : undefined
  // const cloudFile = await Tree.getCloudFile(encryptedName, parentFolder.value.id)
  let cloudFile = await Database.dbFindOne(Database.dbFilesCloud, {
    key: file.key
  })
  cloudFile = cloudFile ? cloudFile.value : null
  if (cloudFile && localFile) {
    const cloudTime = new Date(cloudFile.createdAt).setMilliseconds(0)
    const localTime = localFile.mtime.setMilliseconds(0)
    if (cloudTime < localTime) {
      file.state = state.state.UPLOAD
      file.value.createdAt = localTime
      await uploadFile(
        file,
        localFile,
        cloudFile,
        encryptedName,
        rootPath,
        user,
        parentFolder
      )
      await Database.dbUpdate(
        Database.dbFiles,
        { key: file.key },
        { $set: file }
      )
      return
    }
    if (cloudTime > localTime) {
      file.state = state.state.DOWNLOAD
      file.value = cloudFile
      await downloadFile(file, cloudFile, localFile)
      await Database.dbUpdate(
        Database.dbFiles,
        { key: file.key },
        { $set: file }
      )
      return
    }
    if (cloudTime === localTime) {
      file.state = state.state.SYNCED
      file.needSync = false
      file.value = cloudFile
      await Database.dbUpdate(
        Database.dbFiles,
        { key: file.key },
        { $set: file }
      )
    }
  }
  if (!cloudFile && localFile) {
    const localTime = localFile.mtime.setMilliseconds(0)
    const selectTime = new Date(file.value.createdAt).setMilliseconds(0)
    if (localTime > selectTime) {
      file.value = cloudFile
      file.state = state.state.UPLOAD
      await uploadFile(
        file,
        localFile,
        cloudFile,
        encryptedName,
        rootPath,
        user,
        parentFolder
      )
      await Database.dbUpdate(
        Database.dbFiles,
        { key: file.key },
        { $set: file }
      )
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

function setEnsureMode(mode, probability = 0.01) {
  ensureMode = mode
  ensureProbability = probability
}

export default {
  removeFile,
  createFileEntry,
  sincronizeLocalFile,
  sincronizeCloudFile,
  removeFileEntry,
  sincronizeFile,
  setEnsureMode
}
