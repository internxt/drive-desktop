import { ipcMain } from 'electron';
import Logger from 'electron-log';
import { BackupInfo } from '../../../../backups/BackupInfo';
import { BackupWorker } from './BackupWorker';
import { BackupsStopController } from '../BackupsStopController/BackupsStopController';
import { BackupsIPCMain } from '../BackupsIpc';
import { WorkerExitCause } from '../BackupsProcessTracker/BackupsProcessTracker';

function addMessagesHandlers(
  info: BackupInfo,
  stopController: BackupsStopController
) {
  BackupsIPCMain.handleOnce('backups.get-backup', () => info);

  BackupsIPCMain.on('backups.backup-completed', (_, folderId) => {
    ipcMain.emit('BACKUP_COMPLETED', folderId);
  });

  BackupsIPCMain.on('backups.backup-failed', (_, _folderId, error) => {
    Logger.error(`[Backup] error: ${error}`);
    stopController.failed(error);
  });
}

function removeMessagesHandlers() {
  BackupsIPCMain.removeHandler('backups.get-backup');
  BackupsIPCMain.removeAllListeners('backups.backup-completed');
  BackupsIPCMain.removeAllListeners('backups.backup-failed');
}

function listenForBackupFinalization(): Promise<WorkerExitCause> {
  const finished = new Promise<WorkerExitCause>((resolve) => {
    BackupsIPCMain.on('backups.backup-completed', () => {
      resolve('backup-completed');
    });

    BackupsIPCMain.on('backups.stopped', () => {
      resolve('forced-by-user');
    });

    BackupsIPCMain.on('backups.backup-failed', (_, _folderId, error) => {
      resolve(error);
    });
  });

  return finished;
}

export async function executeBackupWorker(
  info: BackupInfo,
  stopController: BackupsStopController
): Promise<WorkerExitCause> {
  addMessagesHandlers(info, stopController);

  const finished = listenForBackupFinalization();

  const worker = BackupWorker.spawn(info.folderId);

  stopController.on('forced-by-user', () => {
    worker.send('backups.abort');
  });

  const reason = await finished;

  removeMessagesHandlers();

  worker.destroy();

  return reason;
}
