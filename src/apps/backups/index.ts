import Logger from 'electron-log';
import { ipcRenderer } from 'electron';
import { BackupService } from './BackupService';
import { BackupInfo } from './BackupInfo';
import { BackupsIPCRenderer } from './BackupsIPCRenderer';
import { BackupsDependencyContainerFactory } from './dependency-injection/BackupsDependencyContainerFactory';
import { DriveDesktopError } from '../../context/shared/domain/errors/DriveDesktopError';

function handleAbortAndOfflineEvents(
  abortController: AbortController,
  backupInfo: BackupInfo
) {
  window.addEventListener('offline', () => {
    Logger.log('[BACKUPS] Internet connection lost');
    abortController.abort('CONNECTION_LOST');
    BackupsIPCRenderer.send(
      'backups.backup-failed',
      backupInfo.folderId,
      'NO_INTERNET'
    );
  });

  BackupsIPCRenderer.on('backups.abort', () => {
    Logger.log('[BACKUPS] User cancelled backups');
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
    Logger.error(
      '[BACKUPS] Error getting backup info:',
      backupInfoResult.getLeft().cause
    );
    const error = backupInfoResult.getLeft();
    handleBackupFailed(
      0,
      error instanceof DriveDesktopError ? error.cause : 'UNKNOWN'
    );
    return;
  }

  const backupInfo = backupInfoResult.getRight();
  const abortController = new AbortController();
  Logger.info('[BACKUPS] Backup info obtained:', backupInfo);
  handleAbortAndOfflineEvents(abortController, backupInfo);
  const result = await backupService.runWithRetry(backupInfo, abortController);

  if (result.isLeft()) {
    Logger.info('[BACKUPS] failed', result.getLeft().cause);
    const error = result.getLeft();
    handleBackupFailed(
      backupInfo.folderId,
      error instanceof DriveDesktopError ? error.cause : 'UNKNOWN'
    );
  } else {
    Logger.info('[BACKUPS] Backup completed successfully');
    BackupsIPCRenderer.send('backups.backup-completed', backupInfo.folderId);
  }
}

async function reinitializeBackups() {
  await BackupsDependencyContainerFactory.reinitialize();
  Logger.info('[BACKUPS] Reinitialized');
}

ipcRenderer.on('reinitialize-backups', async () => {
  await reinitializeBackups();
});

void backupFolder();
