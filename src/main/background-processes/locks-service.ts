import fetch from 'electron-fetch';
import Logger from 'electron-log';

import { onUserUnauthorized } from '../auth/handlers';
import { getHeaders } from '../auth/service';
import {
  FolderIsLocked,
  LockServiceUnavailabe,
  UnknonwLockServiceError,
} from './lock-erros';

async function acquireOrRefreshLock(
  folderId: number,
  lockId: string
): Promise<'OK' | never> {
  const res = await fetch(
    `${process.env.API_URL}/api/storage/folder/${folderId}/lock/${lockId}/acquireOrRefresh`,
    { method: 'PUT', headers: getHeaders() }
  );

  Logger.debug(
    `Lock for folderId ${folderId} with id ${lockId} acquired/refreshed with status: ${res.status}`
  );

  if (res.ok) {
    return 'OK';
  }

  if (res.status === 401) {
    onUserUnauthorized();
  }

  if (res.status === 409) {
    throw new FolderIsLocked();
  }

  if (res.status === 503) {
    throw new LockServiceUnavailabe();
  }

  throw new UnknonwLockServiceError(
    `Lock for folderId ${folderId} with id ${lockId} could not be acquired/refreshed, status: ${res.status}`
  );
}

async function releaseLock(
  folderId: number,
  lockId: string
): Promise<'OK' | never> {
  const res = await fetch(
    `${process.env.API_URL}/api/storage/folder/${folderId}/lock/${lockId}`,
    {
      method: 'DELETE',
      headers: getHeaders(),
    }
  );

  Logger.debug(
    `Lock for folderId ${folderId} with id ${lockId} released with status: ${res.status}`
  );

  if (res.ok) {
    return 'OK';
  }

  if (res.status === 401) {
    onUserUnauthorized();
  }

  if (res.status === 503) {
    throw new LockServiceUnavailabe();
  }

  throw new UnknonwLockServiceError(
    `Lock for folderId ${folderId} with id ${lockId} could not be released, status: ${res.status}`
  );
}

export default { releaseLock, acquireOrRefreshLock };
