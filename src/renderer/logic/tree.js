import FS from 'fs'
import PATH from 'path'
import database from '../../database/index'
import async from 'async'
import crypt from './crypt'

function safeReadDirSync(path) {
  let dirData = {}
  try {
    dirData = FS.readdirSync(path)
  } catch (ex) {
    if (ex.code === 'EACCES' || ex.code === 'EPERM') {
      // User does not have permissions, ignore directory
      return null
    } else throw ex
  }
  return dirData
}

function GetTreeFromFolder(folderPath) {
  const result = safeReadDirSync(folderPath)
  const folderName = PATH.basename(folderPath)

  const object = {
    name: folderName,
    files: [],
    children: []
  }

  result.forEach(item => {
    const fullPath = PATH.join(folderPath, item)

    let stats
    try { stats = FS.statSync(fullPath) } catch (e) { return null }

    if (stats.isFile()) {
      const fileCtime = stats.ctime
      fileCtime.setMilliseconds(0)
      const fileMtime = stats.mtime
      fileMtime.setMilliseconds(0)
      const file = {
        name: item,
        size: stats.size,
        created_at: fileCtime,
        updated_at: fileMtime,
        fullPath: PATH.join(fullPath, item)
      }
      object.files.push(file)
    } else {
      object.children.push(GetTreeFromFolder(fullPath))
    }
  })

  return object
}

function GetListFromFolder(folderPath) {
  const result = safeReadDirSync(folderPath)

  var returnResult = []

  result.forEach(item => {
    const fullPath = PATH.join(folderPath, item)
    let stats
    try { stats = FS.statSync(fullPath) } catch (e) { return null }
    if (stats.isFile()) {
      const fileName = PATH.basename(fullPath)
      if (fileName !== '.DS_Store') {
        returnResult.push(fullPath)
      }
    } else {
      returnResult = returnResult.concat(GetListFromFolder(fullPath))
    }
  })

  return returnResult
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
      let decryptedName = crypt.DecryptName(item.name, item.parentId)
      let fullNewPath = PATH.join(currentPath || basePath, decryptedName)
      finalList.push(fullNewPath)
      var subFolder = await _recursiveFolderToList(item, basePath, fullNewPath)
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
      let decryptedName = crypt.DecryptName(item.name, item.parentId)
      let fullNewPath = PATH.join(currentPath || basePath, decryptedName)
      let cloneObject = JSON.parse(JSON.stringify(item))
      delete cloneObject.children
      let finalObject = { key: fullNewPath, value: cloneObject }
      finalList.push(finalObject)
      var subFolder = await _recursiveFolderObjectToList(item, basePath, fullNewPath)
      finalList = finalList.concat(subFolder)
      next()
    }, (err, result) => {
      if (err) { reject(err) } else { resolve(finalList) }
    })
  })
}

function GetFolderObjectListFromRemoteTree() {
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
      let decryptedName = crypt.DecryptName(item.name, item.parentId)
      let fullNewPath = PATH.join(currentPath || basePath, decryptedName)
      var subFolder = await _recursiveFilesToList(item, basePath, fullNewPath)
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
  return new Promise((resolve, reject) => {
    let data = safeReadDirSync(localPath)
    let folders = []

    async.eachSeries(data, (item, next) => {
      const itemPath = PATH.join(localPath, item)
      const stat = FS.lstatSync(itemPath)
      if (!stat.isFile()) {
        folders.push(itemPath)
        GetLocalFolderList(itemPath).then(subFolders => {
          folders = folders.concat(subFolders)
          next()
        }).catch(next)
      } else { next() }
    }, (err, result) => {
      if (err) { reject(err) } else { resolve(folders) }
    })
  })
}

function GetLocalFileList(localPath) {
  return new Promise((resolve, reject) => {
    let data = safeReadDirSync(localPath)
    let files = []

    async.eachSeries(data, (item, next) => {
      const itemPath = PATH.join(localPath, item)
      const stat = FS.lstatSync(itemPath)
      if (!stat.isFile()) {
        GetLocalFileList(itemPath).then(subFolders => {
          files = files.concat(subFolders)
          next()
        }).catch(next)
      } else {
        files.push(itemPath)
        next()
      }
    }, (err, result) => {
      if (err) { reject(err) } else { resolve(files) }
    })
  })
}

export default {
  GetTreeFromFolder,
  GetListFromFolder,
  GetStat,
  GetFolderListFromRemoteTree,
  GetFileListFromRemoteTree,
  GetFolderObjectListFromRemoteTree,
  GetLocalFolderList,
  GetLocalFileList
}
