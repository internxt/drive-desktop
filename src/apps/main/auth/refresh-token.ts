import { logger } from '@/apps/shared/logger/logger';
import { TokenScheduler } from '../token-scheduler/TokenScheduler';
import { obtainToken, updateCredentials } from './service';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { onUserUnauthorized } from './handlers';

export class RefreshTokenError extends Error {}

async function refreshToken() {
  logger.debug({ msg: 'Obtaining new tokens' });
  const { data, error } = await driveServerWipModule.auth.refresh();

  if (error) {
    onUserUnauthorized();
    throw new RefreshTokenError();
  }

  const { newToken } = data;

  updateCredentials({ newToken });

  return newToken;
}

export async function createTokenSchedule(refreshedToken?: string) {
  const token = refreshedToken || obtainToken();

  const shceduler = new TokenScheduler(token);
  const schedule = shceduler.schedule(refreshToken);

  if (!schedule && !refreshedToken) {
    logger.debug({ msg: 'Refreshing tokens' });
    createTokenSchedule(await refreshToken());
  }
}
