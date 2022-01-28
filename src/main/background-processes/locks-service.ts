import fetch from 'electron-fetch';

import { getHeaders } from '../auth/service';

async function acquireLock(folderId: number, lockId: string) {
  const res = await fetch(
    `${process.env.API_URL}/api/storage/folder/${folderId}/lock/${lockId}`,
    { method: 'POST', headers: getHeaders() }
  );
  if (!res.ok) {
    throw new Error(`Lock could not be acquired, status: ${res.status}`);
  }
}

async function refreshLock(folderId: number, lockId: string) {
  const res = await fetch(
    `${process.env.API_URL}/api/storage/folder/${folderId}/lock/${lockId}`,
    { method: 'PUT', headers: getHeaders() }
  );
  if (!res.ok) {
    throw new Error(`Lock could not be refreshed, status: ${res.status}`);
  }
}

async function releaseLock(folderId: number, lockId: string) {
  await fetch(
    `${process.env.API_URL}/api/storage/folder/${folderId}/lock/${lockId}`,
    { method: 'DELETE', headers: getHeaders() }
  );
}

export default { acquireLock, refreshLock, releaseLock };
