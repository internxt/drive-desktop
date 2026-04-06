import { logger } from '@internxt/drive-desktop-core/build/backend';
import { ipcMain } from 'electron';
import { AuthContext } from '@/apps/sync-engine/config';
import { electronStore } from '../../config';
import { eventBus } from '../../event-bus';
import { BackupScheduler } from './BackupScheduler/BackupScheduler';
import { tracker } from './BackupsProcessTracker/BackupsProcessTracker';
import { launchBackupProcesses } from './launchBackupProcesses';

export function backupsSetInterval({ ctx, interval }: { ctx: AuthContext; interval: number }) {
  logger.debug({ msg: 'Backup interval has been changed', interval });
  electronStore.set('backupInterval', interval);
  BackupScheduler.start({ ctx });
}

export async function backupsStartProcess({ ctx }: { ctx: AuthContext }) {
  logger.debug({ msg: 'Backups started manually' });
  await launchBackupProcesses({ ctx });
}

export function setUpBackups() {
  logger.debug({ msg: 'Setting up backups' });

  ipcMain.handle('get-backups-interval', () => {
    return electronStore.get('backupInterval');
  });

  ipcMain.handle('get-last-backup-timestamp', () => {
    return electronStore.get('lastBackup');
  });

  ipcMain.handle('get-backups-status', () => {
    return tracker.status;
  });

  eventBus.on('USER_LOGGED_OUT', () => tracker.reset());
}
