import Database from '../../database/index'
import Logger from '../../libs/logger'
import Auth from './utils/Auth'
import AesUtil from './AesUtil'
import Uploader from './uploader'
import getEnvironment from './utils/libinxt'
import async from 'async'
import Tree from './tree'
import fs from 'fs'
import analytics from './utils/analytics'
import ConfigStore from '../../main/config-store'
import state from './utils/state'
import lodash from 'lodash'
import path from 'path'

function infoFromPath(localPath) {
  return new Promise((resolve, reject) => {
    Database.dbFiles.findOne({ key: localPath }, function(err, result) {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}
// BucketId and FileId must be the NETWORK ids (mongodb)
async function removeFile(bucketId, fileId) {
  return fetch(
    `${process.env.API_URL}/api/storage/bucket/${bucketId}/file/${fileId}`,
    {
      method: 'DELETE',
      headers: await Auth.getAuthHeader()
    }
  ).catch(err => {
    Logger.error('Fetch error removing file', err)
    throw err
  })
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
      method: 'POST',
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

async function sincronizeLocalFile() {
  const localPath = await Database.Get('xPath')
  var list = await Tree.getLocalFileList(localPath)
  var i = 0
  var select = await Database.dbFind(Database.dbFiles, {})
  var indexDict = []
  select.map(elem => {
    indexDict[elem.key] = i++
  })
  for (const item of list) {
    if (ConfigStore.get('stopSync')) {
      throw Error('stop sync')
    }
    const localFile = Tree.getStat(item)
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
            createdAt: localFile.ctime,
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
      const selectTime = selectFile.value.updatedAt.setMilliseconds(0)
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
        selectFile.value.updateAt = localFile.mtime
        selectFile.state = state.transition(
          selectFile.state,
          state.word.uploadAndReplace
        )
        selectFile.needSync = true
        continue
      } else {
        selectFile.state = state.transition(
          selectFile.state,
          state.word.ensure
        )
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
  await Database.ClearFilesSelect()
  await Database.dbInsert(Database.dbFiles, select)
}

// Check files that does not exists in local anymore (use last sync tree), and remove them from remote
async function cleanRemoteWhenLocalDeleted(lastSyncFailed) {
  if (lastSyncFailed) {
    return
  }
  const allData = Database.dbFiles.getAllData()
  for (const item of allData) {
    if (ConfigStore.get('stopSync')) {
      throw Error('stop sync')
    }
    const stat = Tree.getStat(item.key)

    // If it doesn't exists, or it exists and now is not a file, delete from remote.
    if ((stat && !stat.isFile()) || !fs.existsSync(item.key)) {
      const bucketId = item.value.bucket
      const fileId = item.value.fileId

      try {
        if (item.value.size === 0) {
          await removeFileEntry(
            item.value.bucket,
            item.value.fileId,
            item.value.name,
            item.value.type,
            item.value.size,
            item.value.folder_id,
            item.value.updateAt
          )
        } else {
          await removeFile(bucketId, fileId)
        }
        console.log('FILE REMOVED')
        analytics
          .track({
            userId: undefined,
            event: 'file-delete',
            platform: 'desktop',
            properties: {
              email: 'email',
              file_id: fileId
            }
          })
          .catch(err => {
            Logger.error(err)
          })
        continue
      } catch (err) {
        Logger.error('Error deleting remote file %j: %s', item, err)
        throw err
      }
    } /* else {
        return
      } */
  }
}

// Delete local files that doesn't exists on remote.
// It should be called just after tree sync.
async function cleanLocalWhenRemoteDeleted(lastSyncFailed) {
  const localPath = await Database.Get('xPath')
  const syncDate = await Database.Get('syncStartDate')

  // List all files in the folder
  const list = await Tree.getLocalFileList(localPath)

  for (const item of list) {
    const fileObj = await Database.FileGet(item)

    if (ConfigStore.get('stopSync')) {
      throw Error('stop sync')
    }
    if (!fileObj && !lastSyncFailed) {
      // File doesn't exists on remote database, should be locally deleted?

      const creationDate = fs.statSync(item).mtime
      creationDate.setMilliseconds(0)
      // To check if the file was added during the sync, if so, should not be deleted
      const isTemp = await Database.TempGet(item)

      // Delete if: Not in temp, not was "added" or was deleted
      if (!isTemp || isTemp.value !== 'add') {
        // TODO: Watcher will track this deletion
        try {
          fs.unlinkSync(item)
          Logger.info(item + ' deleted')
        } catch (e) {
          Logger.warn(e.messages)
        }
        Database.TempDel(item)
      }
      // return
    } /* else {
        // File still exists on the remote database, should not be deleted
        return
      } */
  }
}

function fileInfoFromPath(localPath) {
  return new Promise((resolve, reject) => {
    Database.dbFiles.findOne({ key: localPath }, function(err, result) {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

export default {
  infoFromPath,
  removeFile,
  createFileEntry,
  sincronizeLocalFile,
  restoreFile,
  cleanRemoteWhenLocalDeleted,
  cleanLocalWhenRemoteDeleted,
  fileInfoFromPath,
  removeFileEntry
}
