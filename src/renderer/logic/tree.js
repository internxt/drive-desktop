import FS from 'fs'
import PATH from 'path'
import database from '../../database'
import async from 'async'
import crypt from './crypt'
import readdirp from 'readdirp'
import sanitize from 'sanitize-filename'
import Logger from '../../libs/logger'
import Auth from './utils/Auth'

const IgnoredFiles = [
  '^\\.(DS_Store|[Tt]humbs)$',
  '.*~$',
  '^\\._.*',
  '^~.*'
]

function GetListFromFolder(folderPath) {
  return new Promise((resolve) => {
    const results = []
    readdirp(folderPath, {
      type: 'files'
    }).on('data', data => {
      if (data.basename !== sanitize(data.basename)) {
        return Logger.info('Ignoring %s, filename not compatible', data.fullPath)
      }

      const invalid = IgnoredFiles.find(regex => new RegExp(regex).test(data.basename))

      if (typeof invalid === 'undefined') {
        results.push(data.fullPath)
      }
    }).on('warn', warn => console.error('READDIRP non-fatal error', warn))
      .on('error', err => console.error('READDIRP fatal error', err.message))
      .on('end', () => { resolve(results) })
  })
}

function GetStat(path) {
  try {
    return FS.lstatSync(path)
  } catch (err) {
    return null
  }
}

function _recursiveFolderToList(tree, basePath, currentPath = null) {
  let finalList = []
  return new Promise((resolve, reject) => {
    async.eachSeries(tree.children, async (item, next) => {
      const decryptedName = crypt.DecryptName(item.name, item.parentId)
      const fullNewPath = PATH.join(currentPath || basePath, decryptedName)
      finalList.push(fullNewPath)
      const subFolder = await _recursiveFolderToList(item, basePath, fullNewPath)
      finalList = finalList.concat(subFolder)
      next()
    }, (err, result) => {
      if (err) { reject(err) } else { resolve(finalList) }
    })
  })
}

function GetFolderListFromRemoteTree() {
  return new Promise(async (resolve, reject) => {
    const tree = await database.Get('tree')
    const basePath = await database.Get('xPath')
    _recursiveFolderToList(tree, basePath).then(list => resolve(list)).catch(reject)
  })
}

function _recursiveFolderObjectToList(tree, basePath, currentPath = null) {
  let finalList = []
  return new Promise((resolve, reject) => {
    async.eachSeries(tree.children, async (item, next) => {
      const decryptedName = crypt.DecryptName(item.name, item.parentId)
      const fullNewPath = PATH.join(currentPath || basePath, decryptedName)
      const cloneObject = JSON.parse(JSON.stringify(item))
      delete cloneObject.children
      const finalObject = { key: fullNewPath, value: cloneObject }
      finalList.push(finalObject)
      const subFolder = await _recursiveFolderObjectToList(item, basePath, fullNewPath)
      finalList = finalList.concat(subFolder)
      next()
    }, (err, result) => {
      if (err) { reject(err) } else { resolve(finalList) }
    })
  })
}

function getFolderObjectListFromRemoteTree() {
  return new Promise(async (resolve, reject) => {
    const tree = await database.Get('tree')
    const basePath = await database.Get('xPath')
    _recursiveFolderObjectToList(tree, basePath).then(list => resolve(list)).catch(reject)
  })
}

function _recursiveFilesToList(tree, basePath, currentPath = null) {
  let finalList = tree.files

  finalList.forEach(item => {
    const encryptedFileName = item.name
    const salt = item.folder_id
    item.filename = crypt.DecryptName(encryptedFileName, salt)
    item.fullpath = PATH.join(currentPath || basePath, item.filename + (item.type ? '.' + item.type : ''))
  })

  return new Promise((resolve, reject) => {
    async.eachSeries(tree.children, async (item, next) => {
      const decryptedName = crypt.DecryptName(item.name, item.parentId)
      const fullNewPath = PATH.join(currentPath || basePath, decryptedName)
      const subFolder = await _recursiveFilesToList(item, basePath, fullNewPath)
      finalList = finalList.concat(subFolder)
      next()
    }, (err, result) => {
      if (err) { reject(err) } else { resolve(finalList) }
    })
  })
}

function GetFileListFromRemoteTree() {
  return new Promise(async (resolve, reject) => {
    const tree = await database.Get('tree')
    const basePath = await database.Get('xPath')
    _recursiveFilesToList(tree, basePath).then(list => resolve(list)).catch(reject)
  })
}

function GetLocalFolderList(localPath) {
  return new Promise((resolve) => {
    const results = []
    readdirp(localPath, {
      type: 'directories'
    }).on('data', data => {
      if (data.basename !== sanitize(data.basename)) {
        return Logger.info('Directory %s ignored, name is not compatible')
      }
      results.push(data.fullPath)
    }).on('warn', warn => console.error('READDIRP non-fatal error', warn))
      .on('error', err => console.error('READDIRP fatal error', err.message))
      .on('end', () => { resolve(results) })
  })
}

function GetLocalFileList(localPath) {
  return GetListFromFolder(localPath)
}

function getTree() {
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

function updateTree() {
  return new Promise((resolve, reject) => {
    getTree().then((tree) => {
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

export default {
  GetListFromFolder,
  GetStat,
  GetFolderListFromRemoteTree,
  GetFileListFromRemoteTree,
  getFolderObjectListFromRemoteTree,
  GetLocalFolderList,
  GetLocalFileList,
  getTree,
  updateTree
}
