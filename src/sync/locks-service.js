import {getHeaders} from '../main/auth'
import fetch from 'electron-fetch'

async function adquireLock(folderId, lockId) {
  const res = await fetch(`${process.env.API_URL}/api/storage/folder/${folderId}/lock/${lockId}`, {method: 'POST', headers: getHeaders()})
  if (!res.ok) { throw new Error(`Lock could not be adquired, status: ${res.status}`) }
}

async function refreshLock(folderId, lockId) {
  const res = await fetch(`${process.env.API_URL}/api/storage/folder/${folderId}/lock/${lockId}`, {method: 'PUT', headers: getHeaders()})
  if (!res.ok) { throw new Error(`Lock could not be refreshed, status: ${res.status}`) }
}

export default {adquireLock, refreshLock}
