import Logger from 'electron-log';

import { getNewTokenClient } from '../../shared/HttpClient/main-process-client';
import { TokenScheduler } from '../token-scheduler/TokenScheduler';
import { onUserUnauthorized } from './handlers';
import { getUser, obtainTokens as obtainStoredTokens, setUser, updateCredentials } from './service';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';

const newAuthorizedClient = getNewTokenClient();

async function obtainTokens() {
  try {
    Logger.debug('[TOKEN] Obtaining new tokens');
    const res = await newAuthorizedClient.get(`${process.env.NEW_DRIVE_URL}/users/refresh`);

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

export async function checkUserData(): Promise<void> {
  const user = getUser();
  if (user && user.root_folder_id && user.rootFolderId) {
    const { data: rootFolderMetadata } = await driveServerWipModule.folders.getMetadata({ folderId: user.root_folder_id });
    if (rootFolderMetadata) {
      setUser({
        ...user,
        rootFolderId: rootFolderMetadata.uuid,
      });
    }
    refreshToken();
  }
}
