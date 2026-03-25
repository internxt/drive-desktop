import { logger } from '@/apps/shared/logger/logger';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { resetConfig } from './utils/reset-config';
import { saveConfig } from './utils/save-config';

export function logout() {
  logger.debug({ tag: 'AUTH', msg: 'Logging out' });

  saveConfig();

  void driveServerWipModule.auth.logout();

  resetConfig();

  logger.debug({ tag: 'AUTH', msg: 'User logged out' });
}
