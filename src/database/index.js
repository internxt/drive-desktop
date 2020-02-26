import Datastore from 'nedb'
import path from 'path'
import { remote } from 'electron'
import fs from 'fs'
import async from 'async'

const databaseFolder = `${process.env.NODE_ENV === 'production' ? remote.app.getPath('home') + `/.xclouddesktop/` : '.'}`

if (!fs.existsSync(databaseFolder)) { fs.mkdirSync(databaseFolder) }

const dbFiles = new Datastore({
  filename: path.join(databaseFolder, 'database_files.db'),
  autoload: true,
  timestampData: true
})
const dbLastFiles = new Datastore({
  filename: path.join(databaseFolder, 'database_last_files.db'),
  autoload: true,
  timestampData: true
})
const dbLastFolders = new Datastore({
  filename: path.join(databaseFolder, 'database_last_folders.db'),
  autoload: true,
  timestampData: true
})
const dbFolders = new Datastore({
  filename: path.join(databaseFolder, 'database_folders.db'),
  autoload: true,
  timestampData: true
})
const dbUser = new Datastore({
  filename: path.join(databaseFolder, 'database_user.db'),
  autoload: true,
  timestampData: true
})
const dbTemp = new Datastore({
  filename: path.join(databaseFolder, 'database_temp.db'),
  autoload: true,
  timestampData: true
})

function InsertKeyValue(db, key, value) {
  return new Promise((resolve, reject) => {
    db.remove({ key }, { multi: true }, function (err, numRemoved) {
      if (err) {
        console.error('Error removing key/value: %s/%s', key, value)
        reject(err)
      } else {
        db.insert({ key, value }, function (err, newDoc) {
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

const Get = async (key) => {
  const promise = new Promise((resolve, reject) => {
    dbUser.findOne({ key: key }, (err, result) => {
      if (err) { reject(err) } else { resolve(result) }
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

const TempSet = (key, value) => {
  return InsertKeyValue(dbTemp, key, value)
}

const FileSet = (key, value) => {
  return InsertKeyValue(dbFiles, key, value)
}

const FolderGet = (key) => {
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

const FileGet = (key) => {
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

const TempGet = (key) => {
  return new Promise((resolve, reject) => {
    dbTemp.findOne({ key: key }, (err, document) => {
      if (err) { resolve(null) } else { resolve(document) }
    })
  })
}

const TempDel = (key) => {
  return new Promise((resolve, reject) => {
    dbTemp.remove({ key: key }, (err, result) => {
      if (err) { reject(err) } else { resolve() }
    })
  })
}

const ClearTemp = () => {
  return new Promise((resolve, reject) => {
    dbTemp.remove({}, { multi: true }, (err, totalFilesRemoved) => {
      if (err) { reject(err) } else { resolve(totalFilesRemoved) }
    })
  })
}

const ClearFiles = () => {
  return new Promise((resolve, reject) => {
    dbFiles.remove({}, { multi: true }, (err, totalFilesRemoved) => {
      if (err) { reject(err) } else { resolve(totalFilesRemoved) }
    })
  })
}

const ClearFolders = () => {
  return new Promise((resolve, reject) => {
    dbFolders.remove({}, { multi: true }, (err, totalFilesRemoved) => {
      if (err) { reject(err) } else { resolve(totalFilesRemoved) }
    })
  })
}

const CompactAllDatabases = () => {
  dbFolders.persistence.compactDatafile()
  dbFiles.persistence.compactDatafile()
  dbTemp.persistence.compactDatafile()
}

const BackupCurrentTree = () => {
  return new Promise((resolve, reject) => {
    async.waterfall([
      next => {
        Get('tree').then(lastTree => {
          Set('treeBackup', lastTree).then(() => next()).catch(next)
        }).catch(next)
      },
      next => dbLastFolders.remove({}, { multi: true }, (err) => next(err)),
      next => dbLastFiles.remove({}, { multi: true }, (err) => next(err)),
      next => {
        dbFolders.find({}, (err, docs) => {
          if (err) { return next(err) }
          async.eachSeries(docs, (doc, nextDoc) => {
            dbLastFolders.insert(doc, (err) => nextDoc(err))
          }, (err) => next(err))
        })
      },
      next => {
        dbFiles.find({}, (err, docs) => {
          if (err) { return next(err) }
          async.eachSeries(docs, (doc, nextDoc) => {
            dbLastFiles.insert(doc, (err) => nextDoc(err))
          }, (err) => next(err))
        })
      },
      next => {
        dbLastFiles.persistence.compactDatafile()
        dbLastFolders.persistence.compactDatafile()
        dbUser.persistence.compactDatafile()
        next()
      }
    ], (err) => {
      if (err) { reject(err) } else { resolve() }
    })
  })
}

export default {
  dbFiles,
  dbFolders,
  dbUser,
  dbLastFolders,
  dbLastFiles,
  Get,
  Set,
  FolderSet,
  FileSet,
  FolderGet,
  FileGet,
  TempGet,
  TempSet,
  TempDel,
  ClearTemp,
  ClearFiles,
  ClearFolders,
  CompactAllDatabases,
  BackupCurrentTree,
  GetDatabaseFolder: databaseFolder
}
