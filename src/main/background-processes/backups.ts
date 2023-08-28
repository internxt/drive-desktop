import { app, BrowserWindow, ipcMain, powerSaveBlocker } from 'electron';
import Logger from 'electron-log';
import path from 'path';

import { BackupsArgs } from '../../workers/backups';
import { ProcessFatalErrorName } from '../../workers/types';
import { getIsLoggedIn } from '../auth/handlers';
import configStore from '../config';
import { getBackupsFromDevice, getOrCreateDevice } from '../device/service';
import eventBus from '../event-bus';
import { broadcastToWindows } from '../windows';
import { clearBackupsIssues } from './process-issues';
import { BackupFatalError } from './types/BackupFatalError';

ipcMain.handle('get-backups-interval', () => {
  return configStore.get('backupInterval');
});

ipcMain.handle('set-backups-interval', (_, newValue: number) => {
  return configStore.set('backupInterval', newValue);
});

export type BackupsStatus = 'STANDBY' | 'RUNNING';
export type BackupExitReason = 'FORCED_BY_USER' | 'PROCESS_FINISHED';

let backupsStatus: BackupsStatus = 'STANDBY';
let backupsProcessRerun: null | ReturnType<typeof setTimeout> = null;
let backupsLastExitReason: BackupExitReason | null = null;

ipcMain.handle('get-backups-status', () => backupsStatus);

ipcMain.handle('get-backups-enabled', () => configStore.get('backupsEnabled'));

ipcMain.handle('toggle-backups-enabled', () => {
  configStore.set('backupsEnabled', !configStore.get('backupsEnabled'));
});

ipcMain.handle('get-last-backup-timestamp', () =>
  configStore.get('lastBackup')
);

ipcMain.handle('get-last-backup-exit-reason', () => backupsLastExitReason);

function clearBackupsLastExitReason() {
  backupsLastExitReason = null;
}

function clearBackupsTimeout() {
  if (backupsProcessRerun) {
    clearTimeout(backupsProcessRerun);
  }
}

function scheduleBackups(milliseconds: number) {
  backupsProcessRerun = setTimeout(
    () => startBackupProcess(true),
    milliseconds
  );
}

function changeBackupsStatus(newStatus: BackupsStatus) {
  backupsStatus = newStatus;
  broadcastToWindows('backups-status-changed', newStatus);
}

ipcMain.on('start-backups-process', () => startBackupProcess(false));

export type BackupProgress = {
  currentFolder: number;
  totalFolders: number;
  completedItems?: number;
  totalItems?: number;
};

async function startBackupProcess(scheduled: boolean) {
  const backupsEnabled = configStore.get('backupsEnabled');

  if (backupsStatus === 'RUNNING' || !backupsEnabled) {
    return;
  }

  const suspensionBlockId = powerSaveBlocker.start('prevent-display-sleep');

  changeBackupsStatus('RUNNING');
  clearBackupsIssues();
  clearBackupFatalErrors();

  // It's an object to pass it to
  // the individual item processors
  const hasBeenStopped = { value: false };

  ipcMain.once('stop-backups-process', () => {
    hasBeenStopped.value = true;
  });

  const device = await getOrCreateDevice();

  const enabledBackupEntries = await getBackupsFromDevice();

  const items: BackupsArgs[] = enabledBackupEntries.map((backup) => ({
    path: backup.pathname,
    folderId: backup.id,
    tmpPath: app.getPath('temp'),
    backupsBucket: device.bucket,
  }));

  let currentFolder = 1;
  const totalFolders = items.length;

  ipcMain.on('BACKUP_PROGRESS', (_, { completedItems, totalItems }) => {
    broadcastToWindows('backup-progress', {
      currentFolder,
      totalFolders,
      completedItems,
      totalItems,
    });
  });

  ipcMain.emit('BACKUP_PROCESS_STARTED', {
    scheduled,
    foldersToBackup: items,
  });

  for (const item of items) {
    broadcastToWindows('backup-progress', { currentFolder, totalFolders });

    if (!hasBeenStopped.value) {
      await processBackupsItem(item, hasBeenStopped);
    }

    currentFolder++;
  }

  const currentTimestamp = new Date().valueOf();

  configStore.set('lastBackup', currentTimestamp);

  clearBackupsTimeout();

  const backupsInterval = configStore.get('backupInterval');

  if (backupsInterval !== -1 && getIsLoggedIn()) {
    scheduleBackups(backupsInterval);
  }

  changeBackupsStatus('STANDBY');

  ipcMain.removeAllListeners('stop-backups-process');

  powerSaveBlocker.stop(suspensionBlockId);

  backupsLastExitReason = hasBeenStopped.value
    ? 'FORCED_BY_USER'
    : 'PROCESS_FINISHED';

  ipcMain.emit('BACKUP_PROCESS_FINISHED', {
    scheduled,
    foldersToBackup: items.length,
    lastExitReason: backupsLastExitReason,
  });

  ipcMain.removeAllListeners('BACKUP_PROGRESS');
}

function processBackupsItem(
  item: BackupsArgs,
  hasBeenStopped: { value: boolean }
) {
  return new Promise<void>((resolve) => {
    const onExitFuncs: (() => void)[] = [];

    function onExit(
      payload:
        | { reason: 'USER_STOPPED' | 'PROCESS_FINISHED' }
        | { reason: 'FATAL_ERROR'; errorName: ProcessFatalErrorName }
    ) {
      Logger.log(
        `[onBackupsExit] ${item.path} (${item.folderId}) reason: ${payload.reason}`
      );
      onExitFuncs.forEach((f) => f());

      if (payload.reason === 'FATAL_ERROR') {
        addBackupFatalError({ errorName: payload.errorName, ...item });
      }

      resolve();
    }

    if (hasBeenStopped.value) {
      return onExit({ reason: 'USER_STOPPED' });
    }

    ipcMain.handleOnce('get-backups-details', () => item);
    onExitFuncs.push(() => ipcMain.removeHandler('get-backups-details'));

    ipcMain.once('BACKUP_FATAL_ERROR', (_, _folderId, errorName) =>
      onExit({ reason: 'FATAL_ERROR', errorName })
    );
    onExitFuncs.push(() => ipcMain.removeAllListeners('BACKUP_FATAL_ERROR'));

    ipcMain.once('BACKUP_EXIT', (_, folderId) => {
      onExit({ reason: 'PROCESS_FINISHED' });
      ipcMain.emit('BACKUP_COMPLETED', folderId);
    });
    onExitFuncs.push(() => ipcMain.removeAllListeners('BACKUP_EXIT'));

    const worker = spawnBackupsWorker();
    onExitFuncs.push(() => worker.destroy());

    if (hasBeenStopped.value) {
      return onExit({ reason: 'USER_STOPPED' });
    }

    const onUserStopped = () => onExit({ reason: 'USER_STOPPED' });
    ipcMain.once('stop-backups-process', onUserStopped);
    onExitFuncs.push(() =>
      ipcMain.removeListener('stop-backups-process', onUserStopped)
    );
  });
}

function spawnBackupsWorker() {
  const worker = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
  });

  worker
    .loadFile(
      process.env.NODE_ENV === 'development'
        ? '../../release/app/dist/backups/index.html'
        : `${path.join(__dirname, '..', 'backups')}/index.html`
    )
    .catch(Logger.error);

  return worker;
}

let fatalErrors: BackupFatalError[] = [];

function onBackupFatalErrorsChanged() {
  broadcastToWindows('backup-fatal-errors-changed', fatalErrors);
}

ipcMain.handle('get-backup-fatal-errors', () => fatalErrors);
ipcMain.on('add-backup-fatal-errors', (e, errors: Array<BackupFatalError>) => {
  if (!errors) {
    (e as unknown as Array<BackupFatalError>).forEach(addBackupFatalError);
  }
  errors.forEach(addBackupFatalError);
});

ipcMain.handle('delete-backup-error', (_event, folderId: number) => {
  fatalErrors = fatalErrors.filter((error) => error.folderId !== folderId);
  onBackupFatalErrorsChanged();
});

function clearBackupFatalErrors() {
  fatalErrors = [];
  onBackupFatalErrorsChanged();
}

function addBackupFatalError(error: BackupFatalError) {
  fatalErrors.push(error);
  onBackupFatalErrorsChanged();
}

eventBus.on('WIDGET_IS_READY', () => {
  // Check if we should launch backup process
  const lastBackup = configStore.get('lastBackup');
  const backupsInterval = configStore.get('backupInterval');

  if (lastBackup !== -1 && backupsInterval !== -1) {
    const currentTimestamp = new Date().valueOf();

    const millisecondsToNextBackup =
      lastBackup + backupsInterval - currentTimestamp;

    if (millisecondsToNextBackup <= 0) {
      startBackupProcess(true);
    } else {
      scheduleBackups(millisecondsToNextBackup);
    }
  }
});

function stopAndClearBackups() {
  ipcMain.emit('stop-backups-process');
  clearBackupsTimeout();
  clearBackupFatalErrors();
  clearBackupsLastExitReason();
}

eventBus.on('USER_LOGGED_OUT', stopAndClearBackups);
eventBus.on('USER_WAS_UNAUTHORIZED', stopAndClearBackups);
