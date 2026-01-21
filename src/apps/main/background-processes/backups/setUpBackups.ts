import { eventBus } from '../../event-bus';
import { BackupScheduler } from './BackupScheduler/BackupScheduler';
import { launchBackupProcesses } from './launchBackupProcesses';
import { tracker } from './BackupsProcessTracker/BackupsProcessTracker';
import { electronStore } from '../../config';
import { setupBackupConfig } from './BackupConfiguration/BackupConfiguration';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { AuthContext } from '@/apps/sync-engine/config';

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

  setupBackupConfig();

  eventBus.on('USER_LOGGED_OUT', () => tracker.reset());
}
