import Datastore from 'nedb'

const dbFiles = new Datastore({ filename: 'database_files.db', autoload: true })
const dbFolders = new Datastore({ filename: 'database_folders.db', autoload: true })
const dbUser = new Datastore({ filename: 'database_user.db', autoload: true })

function InsertKeyValue (key, value) {
  dbUser.remove({ key }, { multi: true }, () => {
    dbUser.insert({ key, value })
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
  return InsertKeyValue(key, value)
}

export default {
  dbFiles, dbFolders, dbUser, InsertKeyValue, Get, Set
}
