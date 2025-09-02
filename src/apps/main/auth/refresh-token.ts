import { logger } from '@/apps/shared/logger/logger';
import { TokenScheduler } from '../token-scheduler/TokenScheduler';
import { onUserUnauthorized } from './handlers';
import { getUser, obtainTokens as obtainStoredTokens, setUser, updateCredentials } from './service';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';

export class RefreshTokenError extends Error {}

async function refreshToken() {
  logger.debug({ msg: 'Obtaining new tokens' });
  const { data, error } = await driveServerWipModule.auth.refresh();

  if (error) {
    onUserUnauthorized();
    throw new RefreshTokenError();
  }

  const { token, newToken } = data;

  updateCredentials(token, newToken);

  return [token, newToken];
}

export async function createTokenSchedule(refreshedTokens?: Array<string>) {
  const tokens = refreshedTokens || obtainStoredTokens();

  const shceduler = new TokenScheduler(5, tokens, onUserUnauthorized);
  const schedule = shceduler.schedule(refreshToken);

  if (!schedule && !refreshedTokens) {
    logger.debug({ msg: 'Refreshing tokens' });
    createTokenSchedule(await refreshToken());
  }
}

export async function checkUserData(): Promise<void> {
  const user = getUser();
  if (user && user.root_folder_id && !user.rootFolderId) {
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
