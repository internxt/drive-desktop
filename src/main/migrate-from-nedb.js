import Datastore from 'nedb'
import path from 'path'
import fs, { constants } from 'fs'
const remote = require('@electron/remote')

const DB_FILE = path.join(
  remote.app.getPath('userData'),
  '.internxt-desktop',
  'database_user.db'
)

export function getXPath() {
  return new Promise((resolve, reject) => {
    try {
      fs.accessSync(DB_FILE, constants.R_OK)
    } catch (err) {
      reject(err)
    }
    const dbUser = new Datastore({
      filename: DB_FILE,
      autoload: true,
      timestampData: true
    })
    dbUser.findOne({ key: 'xPath' }, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result.value)
      }
    })
  })
}
