import getOldestBackupPending from './getOldestBackupPending'
import crypt from '../renderer/logic/crypt'
import { updateBackup } from './service'
import { ipcRenderer } from 'electron'
const archiver = require('archiver')
const app = require('@electron/remote').app

async function main() {
  // This allows adding new backups
  // while the process is running
  const backupsAlreadyDone = new Set()

  let backup = await getOldestBackupPending()
  console.log('oldest pending backup: ', backup)

  while (backup !== null) {
    console.log('oldest pending backup inside loop: ', backup)
    const hash = await zipAndHash(backup.path)
    console.log('Hash done: ', hash, 'previous hash: ', backup.hash)
    // if (hash !== backup.hash) {
    notifyProgress(backup)
    await new Promise(resolve => setTimeout(resolve, 2000))
    notifyProgress(backup, 50)
    await new Promise(resolve => setTimeout(resolve, 2000))

    await updateBackup({ id: backup.id, hash, lastBackupAt: new Date() })
    notifySuccess(backup)
    // }

    backupsAlreadyDone.add(backup.id)

    backup = await getOldestBackupPending(backupsAlreadyDone)
  }

  await new Promise(resolve => setTimeout(resolve, 10000))
  ipcRenderer.send('backup-process-done')
}

main()

function zipAndHash(backupPath) {
  const archive = archiver('zip', { zlib: { level: 9 } })

  archive.on('error', err => {
    throw err
  })

  archive.directory(backupPath, false)

  archive.finalize()

  return crypt.streamHash(archive)
}

function notifyProgress(backup, progress) {
  app.emit('filelogger-push', {
    filePath: backup.path,
    filename: backup.path,
    action: 'backup',
    date: new Date(),
    progress
  })
}

function notifySuccess(backup) {
  app.emit('filelogger-push', {
    filePath: backup.path,
    filename: backup.path,
    action: 'backup',
    state: 'success',
    date: new Date()
  })
}
