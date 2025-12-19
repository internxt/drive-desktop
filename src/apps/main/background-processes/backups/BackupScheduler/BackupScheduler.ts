import { logger } from '@internxt/drive-desktop-core/build/backend';
import { launchBackupProcesses } from '../launchBackupProcesses';
import { electronStore } from '@/apps/main/config';

export class BackupScheduler {
  private static interval: NodeJS.Timeout | undefined;

  static start() {
    this.stop();

    const lastBackup = electronStore.get('lastBackup');
    const backupInterval = electronStore.get('backupInterval');

    if (lastBackup === -1 || backupInterval === -1) {
      logger.debug({ msg: 'There is no last backup or interval set', lastBackup, backupInterval });
      return;
    }

    this.interval = setInterval(async () => {
      logger.debug({ msg: 'Scheduled backup started' });
      await launchBackupProcesses();
    }, backupInterval);
  }

  static stop() {
    clearInterval(this.interval);
  }
}
