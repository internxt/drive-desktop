import Datastore from 'nedb'

const dbFiles = new Datastore({ filename: 'database_files.db', autoload: true })
const dbFolders = new Datastore({ filename: 'database_folders.db', autoload: true })
const dbUser = new Datastore({ filename: 'database_user.db', autoload: true })

function InsertKeyValue (db, key, value) {
  return new Promise((resolve, reject) => {
    db.remove({ key }, { multi: true }, function (err, numRemoved) {
      if (err) {
        reject(err)
      } else {
        db.insert({ key, value }, function (err, newDoc) {
          if (err) {
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

export default {
  dbFiles, dbFolders, dbUser, Get, Set, FolderSet, FileSet, FolderGet, FileGet
}
