import { getHeaders } from '../main/auth'
import { httpRequest } from '../libs/http-request'

async function acquireLock(folderId, lockId) {
  const res = await httpRequest(
    `${process.env.API_URL}/api/storage/folder/${folderId}/lock/${lockId}`,
    { method: 'POST', headers: getHeaders() }
  )
  if (!res.ok) {
    throw new Error(`Lock could not be acquired, status: ${res.status}`)
  }
}

async function refreshLock(folderId, lockId) {
  const res = await httpRequest(
    `${process.env.API_URL}/api/storage/folder/${folderId}/lock/${lockId}`,
    { method: 'PUT', headers: getHeaders() }
  )
  if (!res.ok) {
    throw new Error(`Lock could not be refreshed, status: ${res.status}`)
  }
}

async function releaseLock(folderId, lockId) {
  await httpRequest(
    `${process.env.API_URL}/api/storage/folder/${folderId}/lock/${lockId}`,
    { method: 'DELETE', headers: getHeaders() }
  )
}

export default { acquireLock, refreshLock, releaseLock }
