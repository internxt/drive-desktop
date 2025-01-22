import Logger from 'electron-log';

import { getNewTokenClient } from '../../shared/HttpClient/main-process-client';
import { TokenScheduler } from '../token-scheduler/TokenScheduler';
import { onUserUnauthorized } from './handlers';
import {
  getUser,
  obtainTokens as obtainStoredTokens,
  setUser,
  updateCredentials,
} from './service';
import axios from 'axios';

const newAuthorizedClient = getNewTokenClient();

async function obtainTokens() {
  try {
    Logger.debug('[TOKEN] Obtaining new tokens');
    const res = await newAuthorizedClient.get(
      `${process.env.NEW_DRIVE_URL}/drive/users/refresh`
    );

    return res.data;
  } catch (err) {
    Logger.debug('[TOKEN] Could not obtain tokens: ', err);
    await onUserUnauthorized();
    return err;
  }
}

async function refreshToken() {
  const response = await obtainTokens();

  if (!response) {
    return;
  }

  const { token, newToken } = response;

  updateCredentials(token, newToken);

  Logger.debug('[TOKEN] Refreshed tokens', token, newToken);
  return [token, newToken];
}

export async function createTokenSchedule(refreshedTokens?: Array<string>) {
  const tokens = refreshedTokens || obtainStoredTokens();

  const shceduler = new TokenScheduler(5, tokens, onUserUnauthorized);
  const schedule = shceduler.schedule(refreshToken);

  if (!schedule && !refreshedTokens) {
    Logger.debug('[TOKEN] Refreshing tokens');
    createTokenSchedule(await refreshToken());
  }
}

async function getRootFolderMetadata(rootFolderid: number) {
  try {
    const res = await newAuthorizedClient.get(
      `${process.env.NEW_DRIVE_URL}/drive/folders/${rootFolderid}/metadata`
    );

    Logger.info('[AUTH] Got root folder metadata', res.data);
    return res.data;
  } catch (err) {
    Logger.error('[AUTH] Could not get root folder metadata', err);
    if (axios.isAxiosError(err)) {
      Logger.error('[Is Axios Error]', err.response?.data);
    }
    return null;
  }
}

export async function checkUserData(): Promise<void> {
  const user = getUser();
  if (user?.root_folder_id && !user?.rootFolderId) {
    const rootFolderMetadata = await getRootFolderMetadata(user.root_folder_id);
    if (rootFolderMetadata) {
      setUser({
        ...user,
        rootFolderId: rootFolderMetadata.uuid,
      });
    }
    refreshToken();
  }
}
