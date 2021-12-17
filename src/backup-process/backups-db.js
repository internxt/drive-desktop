import sqlite from 'sqlite3'
import fs from 'fs-extra'
import path from 'path'

const app =
  process.type === 'renderer'
    ? require('@electron/remote').app
    : require('electron').app

const DATABASE_FOLDER = app.getPath('userData') + `/.internxt-desktop/`

if (!fs.existsSync(DATABASE_FOLDER)) {
  fs.mkdirSync(DATABASE_FOLDER)
}

const db = new sqlite.Database(path.join(DATABASE_FOLDER, 'backups.db'))

db.run(`CREATE TABLE IF NOT EXISTS errors (
  backup_id INTEGER PRIMARY KEY,
  error_code TEXT NOT NULL,
  timestamp INTEGER NOT NULL
); `)

function insertError({ backupId, errorCode, timestamp }) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO errors(backup_id, error_code, timestamp)
    VALUES(${backupId}, '${errorCode}', ${timestamp})
    ON CONFLICT(backup_id) DO UPDATE SET
      error_code='${errorCode}',
      timestamp=${timestamp}
    WHERE backup_id=${backupId};
  `,
      (result, error) => {
        if (error) reject(error)
        resolve(result)
      }
    )
  })
}

function getErrors() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * from errors;`, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
}

function cleanErrors() {
  return new Promise(resolve => {
    db.run('DELETE FROM errors;', resolve)
  })
}

export default { insertError, getErrors, cleanErrors }
