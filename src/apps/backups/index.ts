import Logger from 'electron-log';
import { Backup } from './Backup';
import { BackupInfo } from './BackupInfo';
import { BackupsIPCRenderer } from './BackupsIPCRenderer';
import { BackupsDependencyContainerFactory } from './dependency-injection/BackupsDependencyContainerFactory';
import { DriveDesktopError } from '../../context/shared/domain/errors/DriveDesktopError';

async function obtainBackup(): Promise<BackupInfo> {
  try {
    return BackupsIPCRenderer.invoke('backups.get-backup');
  } catch (error: unknown) {
    Logger.error(error);

    if (error instanceof Error) {
      BackupsIPCRenderer.send('backups.process-error', error.message);
      return Promise.reject(error.name);
    }

    BackupsIPCRenderer.send('backups.process-error', 'unknown');
    return Promise.reject('unknown');
  }
}

async function backupFolder() {
  const data = await obtainBackup();

  try {
    const container = await BackupsDependencyContainerFactory.build();

    const abortController = new AbortController();

    window.addEventListener('offline', () => {
      Logger.log('[BACKUPS] Internet connection lost');
      abortController.abort('CONNECTION_LOST');

      BackupsIPCRenderer.send(
        'backups.backup-failed',
        data.folderId,
        'NO_INTERNET'
      );
    });

    BackupsIPCRenderer.on('backups.abort', () => {
      Logger.log('[BACKUPS] User cancelled backups');
      abortController.abort();

      BackupsIPCRenderer.send('backups.stopped');
    });

    const backup = container.get(Backup);

    const error = await backup.run(data, abortController);

    if (error) {
      BackupsIPCRenderer.send(
        'backups.backup-failed',
        data.folderId,
        error.cause
      );
    }

    Logger.info('[BACKUPS] done');

    BackupsIPCRenderer.send('backups.backup-completed', data.folderId);
  } catch (error) {
    Logger.error('[BACKUPS] ', error);
    if (error instanceof DriveDesktopError) {
      BackupsIPCRenderer.send(
        'backups.backup-failed',
        data.folderId,
        error.cause
      );
      return;
    }

    BackupsIPCRenderer.send('backups.backup-failed', data.folderId, 'UNKNOWN');
  }
}

backupFolder();
