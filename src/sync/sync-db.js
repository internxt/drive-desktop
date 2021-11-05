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

const db = new sqlite.Database(path.join(DATABASE_FOLDER, 'sync.db'))

db.run(`CREATE TABLE IF NOT EXISTS sync (
  "folderId" TEXT,
  "localPath" TEXT,
  "remotePath" TEXT NOT NULL,
  disabled NUMBER NOT NULL,
  listing TEXT,
  PRIMARY KEY ("folderId", "localPath") 
); `)

function insert({folderId, localPath, remotePath}) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO sync("folderId", "localPath", "remotePath", disabled) values ('${folderId}', '${localPath}', '${remotePath}', 0)
    ON CONFLICT("folderId", "localPath") DO UPDATE SET
      disabled=0
      WHERE "folderId"='${folderId}' and "remotePath" = '${remotePath}';`, (result, error) => {
      if (error) { reject(error) } else { resolve(result) }
    })
  })
}

function get() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * from sync where disabled = 0;`, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
}

function disableOne({folderId, localPath}) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE sync SET disabled = 1 WHERE "folderId" = '${folderId}' and "localPath" = '${localPath}';`, (result, error) => {
      if (error) { reject(error) } else { resolve(result) }
    })
  })
}

export default { insert, get, disableOne }
