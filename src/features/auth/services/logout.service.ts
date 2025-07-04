import { logger } from '@/apps/shared/logger/logger';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { saveConfig } from './utils/save-config';
import { resetConfig } from './utils/reset-config';
import { resetCredentials } from './utils/reset-credentials';

export async function logout() {
  logger.info({
    tag: 'AUTH',
    msg: 'Loggin out',
  });

  const { error } = await driveServerWipModule.auth.logout();

  if (error) {
    logger.error({
      tag: 'AUTH',
      msg: 'Could not properly invalidate user session',
      error,
    });
  }
  saveConfig();
  resetConfig();
  resetCredentials();
  logger.info({
    tag: 'AUTH',
    msg: 'User logged out',
  });
}
