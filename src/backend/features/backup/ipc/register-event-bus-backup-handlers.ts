import { logger } from '@internxt/drive-desktop-core/build/backend';
import { backupManager } from '..';
import eventBus from '../../../../apps/main/event-bus';
import { setUpBackups } from '../setup-backups';

export function registerEventBusBackupHandlers(userHasBackupFeatureAvailable: boolean) {
  eventBus.on('USER_LOGGED_OUT', backupManager.stopAndClearBackups);
  eventBus.on('USER_WAS_UNAUTHORIZED', backupManager.stopAndClearBackups);

  eventBus.on('USER_AVAILABLE_PRODUCTS_UPDATED', (updatedProducts) => {
    const userHasBackupFeatureNow = !!updatedProducts?.backups;
    if (userHasBackupFeatureNow && !userHasBackupFeatureAvailable) {
      logger.debug({
        tag: 'BACKUPS',
        msg: 'User now has the backup feature available, setting up backups',
      });
      setUpBackups();
    } else if (!userHasBackupFeatureNow && userHasBackupFeatureAvailable) {
      logger.debug({ tag: 'BACKUPS', msg: 'User no longer has the backup feature available' });
      backupManager.stopAndClearBackups();
    }
  });
}
