import fetch from 'electron-fetch';
import Logger from 'electron-log';

import { getHeaders } from '../auth/service';

async function acquireOrRefreshLock(folderId: number, lockId: string) {
  const res = await fetch(
    `${process.env.API_URL}/api/storage/folder/${folderId}/lock/${lockId}/acquireOrRefresh`,
    { method: 'PUT', headers: getHeaders() }
  );
  if (!res.ok) {
    throw new Error(
      `Lock for folderId ${folderId} with id ${lockId} could not be acquired/refreshed, status: ${res.status}`
    );
  } else {
    Logger.debug(
      `Lock for folderId ${folderId} with id ${lockId} acquired/refreshed with status: ${res.status}`
    );
  }
}

async function releaseLock(folderId: number, lockId: string) {
  const res = await fetch(
    `${process.env.API_URL}/api/storage/folder/${folderId}/lock/${lockId}`,
    { method: 'DELETE', headers: getHeaders() }
  );
  if (!res.ok) {
    Logger.error(
      `Request to release the lock ${lockId} for folder ${folderId} was not succesful, status: ${res.status}`
    );
  } else {
    Logger.debug(
      `Lock for folderId ${folderId} with id ${lockId} released with status: ${res.status}`
    );
  }
}

export default { releaseLock, acquireOrRefreshLock };
