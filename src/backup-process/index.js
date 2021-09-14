import getOldestBackupPending from './getOldestBackupPending'
import crypt from '../renderer/logic/crypt'
import { updateBackup } from './service'
import { ipcRenderer } from 'electron'
import fs from 'fs'
const archiver = require('archiver')

async function main() {
  // This allows adding new backups
  // while the process is running
  const backupsAlreadyDone = new Set()

  let backup = await getOldestBackupPending()

  while (backup !== null) {
    try {
      await checkThatItExists(backup.path)
      const hash = await zipAndHash(backup.path)
      if (hash !== backup.hash) {
        notifyProgress(backup)
        await new Promise(resolve => setTimeout(resolve, 2000))
        notifyProgress(backup, 50)
        await new Promise(resolve => setTimeout(resolve, 2000))

        await updateBackup({ id: backup.id, hash, lastBackupAt: new Date() })
      }
      notifySuccess(backup)
    } catch (_) {
      notifyError(backup)
    }

    backupsAlreadyDone.add(backup.id)
    backup = await getOldestBackupPending(backupsAlreadyDone)
  }

  ipcRenderer.send('backup-process-done')
}

main()

function checkThatItExists(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, async (err, stats) => {
      if (err) reject(err)
      else if (!stats.isDirectory()) {
        reject(new Error('Backups must be directories'))
      } else resolve()
    })
  })
}

function zipAndHash(backupPath) {
  const archive = archiver('zip', { zlib: { level: 9 } })

  archive.on('error', err => {
    throw err
  })

  archive.directory(backupPath, false)

  archive.finalize()

  return crypt.streamHash(archive)
}

function notifyProgress(backup, progress) {}

function notifySuccess(backup) {}

function notifyError(backup) {}
