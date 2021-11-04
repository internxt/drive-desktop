import macaddress from 'macaddress'
import crypt from '../renderer/logic/crypt'
import ConfigStore from '../main/config-store'
import os from 'os'
import {getHeaders} from '../main/auth'

export async function getDeviceByMac() {
  const headers = getHeaders()
  return fetch(
    `${process.env.API_URL}/api/backup/device/${await macaddress.one()}`,
    {
      method: 'GET',
      headers
    }
  ).then(res => {
    if (res.status === 404) {
      throw new Error()
    } else {
      return res.json()
    }
  })
}

export async function createDevice() {
  const headers = getHeaders()
  return fetch(
    `${process.env.API_URL}/api/backup/device/${await macaddress.one()}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ deviceName: os.hostname(), platform: os.platform() })
    }
  ).then(res => {
    return res.json()
  })
}

export function updateDevice(id, name) {
  const headers = getHeaders()
  return fetch(`${process.env.API_URL}/api/backup/device/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ deviceName: name })
  }).then(res => {
    if (res.status !== 200) throw new Error()
    return res.json()
  })
}

export async function createBackup({ path, enabled }, backupsBucketId) {
  const headers = getHeaders()
  const encryptedPath = crypt.encryptName(path, backupsBucketId)
  const { id: deviceId } = await getDeviceByMac()
  return fetch(`${process.env.API_URL}/api/backup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      deviceId,
      path: encryptedPath,
      encryptVersion: '03-aes',
      interval: ConfigStore.get('backupInterval'),
      enabled
    })
  }).then(res => {
    if (res.status !== 200) throw new Error()
    return res.json()
  })
}

export function updateBackup({ id, ...body }) {
  const headers = getHeaders()
  return fetch(`${process.env.API_URL}/api/backup/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body)
  }).then(res => {
    if (res.status !== 200) throw new Error()
    else return res.json()
  })
}

export function updateBackupPath({ id, backupsBucketId, plainPath }) {
  const headers = getHeaders()
  const encryptedPath = crypt.encryptName(plainPath, backupsBucketId)

  return fetch(`${process.env.API_URL}/api/backup/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      path: encryptedPath
    })
  }).then(res => {
    if (res.status !== 200) throw new Error()
    else return res.json()
  })
}

export function fetchUsersBackupBucket() {
  const headers = getHeaders()
  return fetch(`${process.env.API_URL}/api/user/backupsBucket`, {
    method: 'GET',
    headers
  }).then(res => {
    return res.json()
  })
}

export async function getAllBackups() {
  const headers = getHeaders()
  const backups = await fetch(
    `${process.env.API_URL}/api/backup/${await macaddress.one()}`,
    {
      method: 'GET',
      headers
    }
  ).then(res => {
    return res.json()
  })
  return backups.map(backup => ({
    ...backup,
    path: crypt.decryptName(backup.path, backup.bucket, backup.encrypt_version)
  }))
}

export function updateBackupsOfDevice(deviceId, data) {
  const headers = getHeaders()
  return fetch(`${process.env.API_URL}/api/backup/fromDevice/${deviceId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data)
  })
}

export function fetchUsage() {
  const headers = getHeaders()
  return fetch(`${process.env.API_URL}/api/usage`, {
    method: 'GET',
    headers
  }).then(res => {
    return res.json()
  })
}

export function fetchLimit() {
  const headers = getHeaders()
  return fetch(`${process.env.API_URL}/api/limit`, {
    method: 'GET',
    headers
  }).then(res => {
    return res.json()
  })
}
