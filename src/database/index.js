import Datastore from 'nedb'
import path from 'path'
import fs from 'fs'
import async from 'async'
import rimraf from 'rimraf'
import Logger from '../libs/logger'
const remote = require('@electron/remote')

const OLD_DB_FOLDER = `${
  process.env.NODE_ENV === 'production'
    ? remote.app.getPath('home') + `/.xclouddesktop/`
    : '.'
}`
const DB_FOLDER = `${
  process.env.NODE_ENV === 'production'
    ? remote.app.getPath('home') + `/.internxt-desktop/`
    : '.'
}`

// Migration from .xclouddesktop to .internxt-desktop
const oldFolderExists = fs.existsSync(OLD_DB_FOLDER)
const newFolderExists = fs.existsSync(DB_FOLDER)
if (oldFolderExists && !newFolderExists) {
  fs.renameSync(OLD_DB_FOLDER, DB_FOLDER)
  Logger.info(
    'Config folder migration success .xclouddesktop > .internxt-desktop'
  )
} else if (
  oldFolderExists &&
  newFolderExists &&
  process.env.NODE_ENV === 'production'
) {
  Logger.info('Remove old .xclouddesktop folder')
  rimraf.sync(OLD_DB_FOLDER)
}

const initDatabase = () => {
  if (fs.existsSync(path.join(DB_FOLDER, 'database_files.db'))) {
    rimraf.sync(OLD_DB_FOLDER)
  }
  if (!fs.existsSync(DB_FOLDER)) {
    fs.mkdirSync(DB_FOLDER)
  }
}
/*
const dbFiles = new Datastore({
  filename: './database_files_select.db',
  autoload: true,
  timestampData: true
})
*/
const dbFiles = new Datastore({
  filename: path.join(DB_FOLDER, 'database_files_select.db'),
  autoload: true,
  timestampData: true
})
const dbFilesCloud = new Datastore({
  filename: path.join(DB_FOLDER, 'database_files_cloud.db'),
  autoload: true,
  timestampData: true
})
const dbFolders = new Datastore({
  filename: path.join(DB_FOLDER, 'database_folders_select.db'),
  autoload: true,
  timestampData: true
})
const dbFoldersCloud = new Datastore({
  filename: path.join(DB_FOLDER, 'database_folders_cloud.db'),
  autoload: true,
  timestampData: true
})
const dbLastFolders = new Datastore({
  filename: path.join(DB_FOLDER, 'database_last_folders_cloud.db'),
  autoload: true,
  timestampData: true
})
const dbUser = new Datastore({
  filename: path.join(DB_FOLDER, 'database_user.db'),
  autoload: true,
  timestampData: true
})

function InsertKeyValue(db, key, value) {
  return new Promise((resolve, reject) => {
    db.remove({ key }, { multi: true }, function(err, numRemoved) {
      if (err) {
        console.error('Error removing key/value: %s/%s', key, value)
        reject(err)
      } else {
        db.insert({ key, value }, function(err, newDoc) {
          if (err) {
            console.error('Error inserting key/value: %s/%s', key, value)
            reject(err)
          } else {
            resolve(newDoc)
          }
        })
      }
    })
  })
}

const Get = async key => {
  const promise = new Promise((resolve, reject) => {
    dbUser.findOne({ key: key }, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })

  const result = await promise
  return result ? result.value : null
}

const Set = (key, value) => {
  return InsertKeyValue(dbUser, key, value)
}

const FolderSet = (key, value) => {
  return InsertKeyValue(dbFolders, key, value)
}

const FileSet = (key, value) => {
  return InsertKeyValue(dbFiles, key, value)
}
const dbFindOne = (db, consult) => {
  return new Promise((resolve, reject) => {
    db.findOne(consult, (err, document) => {
      if (err) reject(err)
      else resolve(document)
    })
  })
}
const dbFind = (db, consult) => {
  return new Promise((resolve, reject) => {
    db.find(consult, (err, document) => {
      if (err) reject(err)
      else resolve(document)
    })
  })
}

const dbInsert = (db, entries) => {
  return new Promise((resolve, reject) => {
    db.insert(entries, (err, document) => {
      if (err) reject(err)
      else resolve(document)
    })
  })
}
const FolderGet = key => {
  return new Promise((resolve, reject) => {
    dbFolders.findOne({ key: key }, (err, document) => {
      if (err) {
        resolve(null)
      } else {
        resolve(document)
      }
    })
  })
}

const FileGet = key => {
  return new Promise((resolve, reject) => {
    dbFiles.findOne({ key: key }, (err, document) => {
      if (err) {
        resolve(null)
      } else {
        resolve(document)
      }
    })
  })
}

const ClearDatabase = db => {
  return new Promise((resolve, reject) => {
    db.remove({}, { multi: true }, (err, totalFilesRemoved) => {
      if (err) {
        reject(err)
      } else {
        resolve(totalFilesRemoved)
      }
    })
  })
}

const ClearFilesSelect = () => {
  return ClearDatabase(dbFiles)
}
const ClearFilesCloud = () => {
  return ClearDatabase(dbFilesCloud)
}
const ClearFoldersSelect = () => {
  return ClearDatabase(dbFolders)
}
const ClearFoldersCloud = () => {
  return ClearDatabase(dbFoldersCloud)
}
const ClearLastFolders = () => {
  return ClearDatabase(dbLastFolders)
}
const ClearUser = () => {
  return ClearDatabase(dbUser)
}

const compactAllDatabases = () => {
  dbFolders.persistence.compactDatafile()
  dbFiles.persistence.compactDatafile()
  dbLastFolders.persistence.compactDatafile()
  dbUser.persistence.compactDatafile()
  dbFoldersCloud.persistence.compactDatafile()
  dbFilesCloud.persistence.compactDatafile()
}

const ClearAll = () => {
  return new Promise((resolve, reject) => {
    async.parallel(
      [
        next =>
          ClearFilesSelect()
            .then(() => next())
            .catch(next),
        next =>
          ClearFilesCloud()
            .then(() => next())
            .catch(next),
        next =>
          ClearFoldersSelect()
            .then(() => next())
            .catch(next),
        next =>
          ClearFoldersCloud()
            .then(() => next())
            .catch(next),
        next =>
          ClearLastFolders()
            .then(() => next())
            .catch(next),
        next =>
          ClearUser()
            .then(() => next())
            .catch(next)
      ],
      err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      }
    )
  })
}

export default {
  dbFiles,
  dbFilesCloud,
  dbFolders,
  dbFoldersCloud,
  dbLastFolders,
  dbUser,
  Get,
  Set,
  FolderSet,
  FileSet,
  FolderGet,
  FileGet,
  dbFindOne,
  dbFind,
  dbInsert,
  ClearFilesSelect,
  ClearFilesCloud,
  ClearFoldersSelect,
  ClearFoldersCloud,
  ClearLastFolders,
  ClearUser,
  ClearAll,
  compactAllDatabases,
  GetDatabaseFolder: DB_FOLDER,
  initDatabase
}
