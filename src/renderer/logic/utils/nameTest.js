import fs from 'fs'
import rimraf from 'rimraf'
import path from 'path'

const hidefile = require('hidefile')

function createTestFolder(folderPath) {
  fs.mkdirSync(folderPath)
  hidefile.hideSync(folderPath)
}

function removeTestFolder(folderPath) {
  return new Promise((resolve, reject) => {
    rimraf(folderPath, () => {
      resolve()
    })
  })
}

function invalidFileName(filename, testFolder) {
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

function invalidFolderName(foldername, testFolder) {
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
