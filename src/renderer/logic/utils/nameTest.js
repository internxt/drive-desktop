import fs from 'fs'
import rimraf from 'rimraf'
import path from 'path'

const hidefile = require('hidefile')
const testFolderName = '.internxt_name_test'

function createTestFolder(folderPath) {
  fs.mkdirSync(folderPath)
  hidefile.hideSync(folderPath)
}

function removeTestFolder(basePath) {
  const folderPath = path.join(basePath, testFolderName)
  return new Promise((resolve, reject) => {
    rimraf(folderPath, () => {
      resolve()
    })
  })
}

function invalidFileName(filename, basePath) {
  const testFolder = path.join(basePath, testFolderName)
  if (!fs.existsSync(testFolder)) {
    createTestFolder(testFolder)
  }
  const filePath = path.join(testFolder, filename)
  try {
    fs.writeFileSync(filePath, '')
    fs.renameSync(filePath, filePath)
    return false
  } catch (e) {
    return true
  }
}

function invalidFolderName(foldername, basePath) {
  const testFolder = path.join(basePath, testFolderName)
  if (!fs.existsSync(testFolder)) {
    createTestFolder(testFolder)
  }
  const folderPath = path.join(testFolder, foldername)
  try {
    try {
      fs.mkdirSync(folderPath)
    } catch (e) {
      if (e.code !== 'EEXIST') {
        throw e
      }
    }
    fs.renameSync(folderPath, folderPath)
    return false
  } catch (e) {
    return true
  }
}

export default {
  invalidFileName,
  invalidFolderName,
  removeTestFolder
}
