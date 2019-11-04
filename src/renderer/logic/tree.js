import FS from 'fs'
import PATH from 'path'

function safeReadDirSync (path) {
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

function GetTreeFromFolder (folderPath) {
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
      const file = {
        name: item,
        size: stats.size,
        created_at: stats.ctime,
        updated_at: stats.mtime,
        fullPath: PATH.join(fullPath, item)
      }
      object.files.push(file)
    } else {
      object.children.push(GetTreeFromFolder(fullPath))
    }
  })

  return object
}

function GetListFromFolder (folderPath) {
  const result = safeReadDirSync(folderPath)

  var returnResult = []

  result.forEach(item => {
    const fullPath = PATH.join(folderPath, item)
    let stats
    try { stats = FS.statSync(fullPath) } catch (e) { return null }
    if (stats.isFile()) {
      returnResult.push(fullPath)
    } else {
      returnResult.push(fullPath)
      returnResult = returnResult.concat(GetListFromFolder(fullPath))
    }
  })

  return returnResult
}

function GetStat (path) {
  try {
    return FS.lstatSync(path)
  } catch (err) {
    console.error('Error getting stat of %s. Error: %s', path, err)
    return null
  }
}

export default {
  GetTreeFromFolder,
  GetListFromFolder,
  GetStat
}
