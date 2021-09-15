import crypt from '../renderer/logic/crypt'
import { updateBackup, getAllBackups } from './service'
import { ipcRenderer } from 'electron'
import fs from 'fs'
import ErrorCodes from './error-codes'
const archiver = require('archiver')

;(async function main() {
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
    } catch (error) {
      if (error.name in ErrorCodes) notifyError(backup, error.name)
      else notifyError(backup, ErrorCodes.UNKNOWN)
    }

    backupsAlreadyDone.add(backup.id)
    backup = await getOldestBackupPending(backupsAlreadyDone)
  }

  ipcRenderer.send('backup-process-done')
})()

function checkThatItExists(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, async (err, stats) => {
      if (err) {
        const err = new Error('Path not found')
        err.name = ErrorCodes.NOT_FOUND
        reject(err)
      } else if (!stats.isDirectory()) {
        const err = new Error('Paths of Backups must be directories')
        err.name = ErrorCodes.PATH_IS_NOT_DIRECTORY
        reject(err)
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

function notifyError(backup, errorCode) {
  ipcRenderer.send('insert-backup-error', {
    backupId: backup.id,
    errorCode,
    timestamp: new Date().valueOf()
  })
}

async function getOldestBackupPending(backupsToExclude = new Set()) {
  const backups = (await getAllBackups()).filter(
    backup => backup.enabled && !backupsToExclude.has(backup.id)
  )

  if (backups.length === 0) return null

  const backupThatWasNeverDone = backups.find(
    backup => backup.lastBackupAt === null
  )

  if (backupThatWasNeverDone) {
    return backupThatWasNeverDone
  }

  const sortedBackupsWithOldestFirst = backups.sort(
    (a, b) => a.lastBackupAt - b.lastBackupAt
  )

  return sortedBackupsWithOldestFirst[0]
}
