import { updateBackup, getAllBackups } from './service'
import { ipcRenderer } from 'electron'
import fs from 'fs'
import ErrorCodes from './error-codes'
import ConfigStore from '../main/config-store'
import { createCipheriv, randomBytes } from 'crypto'
import { pipeline } from 'stream'
import reject from 'lodash.reject'
const archiver = require('archiver')
const app = require('@electron/remote').app
const { Environment } = require('@internxt/inxt-js')

;(async function main() {
  const userInfo = ConfigStore.get('userData')
  const mnemonic = ConfigStore.get('mnemonic')

  const pendingBackups = await getPendingBackups()

  for (const [i, backup] of pendingBackups.entries()) {
    try {
      await checkThatItExists(backup.path)
      const index = randomBytes(32)

      const fileEncryptionKey = await Environment.utils.generateFileKey(
        mnemonic,
        backup.bucket,
        index
      )
      const { plainHash, encryptedHash, size } = await zipAndHash(
        backup.path,
        fileEncryptionKey,
        index
      )
      if (plainHash || plainHash !== backup.hash) {
        const fileId = await upload({
          backup,
          userInfo,
          index,
          fileEncryptionKey,
          mnemonic,
          encryptedHash,
          size,
          progressCallback: currentBackupProgress =>
            notifyProgress({
              currentBackup: backup,
              currentBackupProgress,
              currentBackupIndex: i,
              totalBackupsCount: pendingBackups.length
            })
        })

        await updateBackup({
          id: backup.id,
          hash: plainHash,
          lastBackupAt: new Date(),
          fileId
        })
        if (backup.fileId) {
          deleteOldBackup({ bucketId: backup.bucket, fileId: backup.fileId })
        }
      }
    } catch (error) {
      console.error(error)
      if (error.name in ErrorCodes) notifyError(backup, error.name)
      else notifyError(backup, ErrorCodes.UNKNOWN)
    }
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

function getZipStream(backupPath) {
  const archive = archiver('zip', { zlib: { level: 9 } })

  archive.directory(backupPath, false)

  archive.finalize()

  return archive
}

function zipAndHash(backupPath, fileEncryptionKey, index) {
  return new Promise(resolve => {
    const archive = archiver('zip', { zlib: { level: 9 } })

    archive.directory(backupPath, false)

    const hasher = new Environment.utils.Hasher()

    const cypher = createCipheriv(
      'aes-256-ctr',
      fileEncryptionKey,
      index.slice(0, 16)
    )

    const encryptedHasher = new Environment.utils.Hasher()

    pipeline(archive, hasher, cypher, encryptedHasher, console.log)
      .on('data', () => {})
      .on('end', () => {
        const plainHash = hasher.getHash().toString('hex')
        const encryptedHash = encryptedHasher.getHash().toString('hex')

        resolve({ plainHash, encryptedHash, size: archive.pointer() })
      })
      .on('error', console.error)

    archive.finalize()
  })
}

async function upload({
  backup,
  userInfo,
  index,
  fileEncryptionKey,
  mnemonic,
  encryptedHash,
  size,
  progressCallback
}) {
  const zipStream = getZipStream(backup.path)

  const options = {
    bridgeUrl: 'https://api.internxt.com',
    bridgeUser: userInfo.email,
    bridgePass: userInfo.userId,
    encryptionKey: mnemonic,
    inject: {
      fileEncryptionKey,
      index
    }
  }

  const environment = new Environment(options)

  return new Promise(resolve => {
    environment.upload(
      backup.bucket,
      {
        filename: randomBytes(24).toString(),
        progressCallback,
        finishedCallback: (err, response) => {
          if (err) reject(err)
          else resolve(response)
        }
      },
      {
        label: 'OneStreamOnly',
        params: { source: { stream: zipStream, hash: encryptedHash, size } }
      }
    )
  })
}

function deleteOldBackup({ bucketId, fileId }) {
  return fetch(
    `${process.env.API_URL}/api/storage/bucket/${bucketId}/file/${fileId}`,
    {
      method: 'DELETE',
      headers: ConfigStore.get('authHeaders')
    }
  ).then(res => res.json())
}

function notifyProgress({
  currentBackup,
  currentBackupProgress,
  currentBackupIndex,
  totalBackupsCount
}) {
  app.emit('backup-progress', {
    currentBackup,
    currentBackupProgress: (currentBackupProgress * 100).toFixed(2),
    currentBackupIndex,
    totalBackupsCount
  })
}

function notifyError(backup, errorCode) {
  ipcRenderer.send('insert-backup-error', {
    backupId: backup.id,
    errorCode,
    timestamp: new Date().valueOf()
  })
}

async function getPendingBackups() {
  const backups = (await getAllBackups()).filter(backup => backup.enabled)

  return backups.sort((a, b) => {
    // Never done backups go first
    if (!a.lastBackupAt) return -1
    else if (!b.lastBackupAt) return 1

    return (
      new Date(a.lastBackupAt).valueOf() - new Date(b.lastBackupAt).valueOf()
    )
  })
}
