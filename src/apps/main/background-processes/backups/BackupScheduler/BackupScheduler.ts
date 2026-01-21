import { logger } from '@internxt/drive-desktop-core/build/backend';
import { launchBackupProcesses } from '../launchBackupProcesses';
import { electronStore } from '@/apps/main/config';
import { AuthContext } from '@/apps/sync-engine/config';

export class BackupScheduler {
  private static timeout: NodeJS.Timeout | undefined;

  static start({ ctx }: { ctx: AuthContext }) {
    this.stop();

    const lastBackup = electronStore.get('lastBackup');
    const backupInterval = electronStore.get('backupInterval');

    if (lastBackup === -1 || backupInterval === -1) {
      logger.debug({ msg: 'There is no last backup or interval set', lastBackup, backupInterval });
      return;
    }

    const nextBackup = lastBackup + backupInterval - Date.now();

    logger.debug({ msg: 'Scheduling backup', lastBackup: new Date(lastBackup), nextBackup });

    this.timeout = setTimeout(async () => {
      logger.debug({ msg: 'Scheduled backup started' });
      await launchBackupProcesses({ ctx });
      this.start({ ctx });
    }, nextBackup);
  }

  static stop() {
    clearTimeout(this.timeout);
    this.timeout = undefined;
  }
}
