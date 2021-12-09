import ConfigStore from '../main/config-store'
import path from 'path'
import fs from 'fs'

const app =
  process.type === 'renderer'
    ? require('@electron/remote').app
    : require('electron').app

const ROOT_FOLDER_NAME = 'Internxt'
const HOME_FOLDER_PATH = app.getPath('home')

export function setupRootFolder(n = 0) {
  const folderName = ROOT_FOLDER_NAME

  const rootFolderName = folderName + (n ? ` (${n})` : '')
  const rootFolderPath = path.join(HOME_FOLDER_PATH, rootFolderName)
  const exists = fs.existsSync(rootFolderPath)

  if (exists) {
    const isEmpty = isEmptyFolder(rootFolderPath)
    if (!isEmpty) {
      return setupRootFolder(n + 1)
    }
  }

  if (!exists) {
    fs.mkdirSync(rootFolderPath)
  }

  return ConfigStore.set('syncRoot', path.join(rootFolderPath, path.sep))
}
function isEmptyFolder(path) {
  if (!fs.existsSync(path)) {
    return true
  } else {
    const filesInFolder = fs.readdirSync(path)
    return filesInFolder.length === 0
  }
}
