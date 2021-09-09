
import macaddress from 'macaddress'
import crypt from '../renderer/logic/crypt'
import ConfigStore from '../main/config-store'

function getHeaders() {
  return ConfigStore.get('authHeaders')
}

export async function createBackup(path, backupsBucketId) {
  const headers = getHeaders()
  const encryptedPath = crypt.encryptName(path, backupsBucketId)
  await fetch(`${process.env.API_URL}/api/backup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      deviceId: await macaddress.one(),
      path: encryptedPath,
      encryptVersion: '03-aes',
      interval: 3600000
    })
  })
}

export async function deleteBackup(id) {
  const headers = getHeaders()
  const deviceId = await macaddress.one()
  await fetch(`${process.env.API_URL}/api/backup/${deviceId}/${id}`, {
    method: 'DELETE',
    headers
  })
}

export async function fetchUsersBackupBucket() {
  const headers = getHeaders()
  return fetch(`${process.env.API_URL}/api/user/backupsBucket`, {
    method: 'GET',
    headers
  })
    .then(res => {
      return res.json()
    })
}

export async function getAllBackups() {
  const headers = getHeaders()
  const backups = await fetch(`${process.env.API_URL}/api/backup/${await macaddress.one()}`, {
    method: 'GET',
    headers
  })
    .then(res => {
      return res.json()
    })
  return backups.map(backup => ({...backup, path: crypt.decryptName(backup.path, backup.bucket)}))
}
