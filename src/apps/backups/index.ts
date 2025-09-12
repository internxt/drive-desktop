import { ipcRenderer } from 'electron';
import { BackupService } from './BackupService';
import { BackupInfo } from './BackupInfo';
import { BackupsIPCRenderer } from './BackupsIPCRenderer';
import { BackupsDependencyContainerFactory } from './dependency-injection/BackupsDependencyContainerFactory';
import { DriveDesktopError } from '../../context/shared/domain/errors/DriveDesktopError';
import { logger } from '@internxt/drive-desktop-core/build/backend';

function handleAbortAndOfflineEvents(
  abortController: AbortController,
  backupInfo: BackupInfo
) {
  window.addEventListener('offline', () => {
    logger.debug({ tag: 'BACKUPS', msg: 'Internet connection lost' });
    abortController.abort('CONNECTION_LOST');
    BackupsIPCRenderer.send(
      'backups.backup-failed',
      backupInfo.folderId,
      'NO_INTERNET'
    );
  });

  BackupsIPCRenderer.on('backups.abort', () => {
    logger.debug({ tag: 'BACKUPS', msg: 'User cancelled backups' });
    abortController.abort();
    BackupsIPCRenderer.send('backups.stopped');
  });
}

function handleBackupFailed(
  folderId: number,
  cause: DriveDesktopError['cause']
) {
  BackupsIPCRenderer.send('backups.backup-failed', folderId, cause);
}

/**
 * This function is going to be executed by the BackupWorker when it spawns and loads the index.html file.
 * See {@link BackupWorker.spawn}
 */
export async function backupFolder(): Promise<void> {
  const container = await BackupsDependencyContainerFactory.build();
  const backupService = container.get(BackupService);
  const backupInfoResult = await backupService.getBackupInfo();

  if (backupInfoResult.isLeft()) {
    logger.error({
      tag: 'BACKUPS',
      msg: 'Error getting backup info:',
      error: backupInfoResult.getLeft().cause
    });
    const error = backupInfoResult.getLeft();
    handleBackupFailed(
      0,
      error instanceof DriveDesktopError ? error.cause : 'UNKNOWN'
    );
    return;
  }

  const backupInfo = backupInfoResult.getRight();
  const abortController = new AbortController();
  logger.debug({ tag: 'BACKUPS', msg: 'Backup info obtained:', backupInfo });
  handleAbortAndOfflineEvents(abortController, backupInfo);
  const result = await backupService.runWithRetry(backupInfo, abortController);

  if (result.isLeft()) {
    logger.debug({ tag: 'BACKUPS', msg: 'failed', error: result.getLeft().cause });
    const error = result.getLeft();
    handleBackupFailed(
      backupInfo.folderId,
      error instanceof DriveDesktopError ? error.cause : 'UNKNOWN'
    );
  } else {
    logger.debug({ tag: 'BACKUPS', msg: 'Backup completed successfully' });
    BackupsIPCRenderer.send('backups.backup-completed', backupInfo.folderId);
  }
}

async function reinitializeBackups() {
  await BackupsDependencyContainerFactory.reinitialize();
  logger.debug({ tag: 'BACKUPS', msg: 'Reinitialized' });
}

ipcRenderer.on('reinitialize-backups', async () => {
  await reinitializeBackups();
});

void backupFolder();
