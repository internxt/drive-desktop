import { logger } from '@/apps/shared/logger/logger';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { saveConfig } from './utils/save-config';
import { resetConfig } from './utils/reset-config';
import { resetCredentials } from './utils/reset-credentials';
import { areCredentialsAlreadyReseted } from './utils/are-credentials-already-reseted';

export async function logout() {
  if (!areCredentialsAlreadyReseted()) {
    logger.debug({
      tag: 'AUTH',
      msg: 'Logging out',
    });

    const { error } = await driveServerWipModule.auth.logout();

    if (error && error?.code !== 'UNAUTHORIZED') {
      logger.error({
        tag: 'AUTH',
        msg: 'Could not properly invalidate user session',
      });
    }
    saveConfig();
    resetConfig();
    resetCredentials();
    logger.debug({
      tag: 'AUTH',
      msg: 'User logged out',
    });
  }
}
