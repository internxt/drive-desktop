import { ipcMain } from 'electron';

import { BackupProgressIssue, BackupsArgs } from '../../workers/backups';
import {
  backupCompleted,
  backupError,
  backupProcessStarted,
  folderBackupCompleted,
  folderBackupStarted,
} from './service';

export type BackupFolder = number;

export type BackupInfo = {
  scheduled: boolean;
  backups: Array<BackupsArgs>;
};

export type BackupFinishedInfo = BackupInfo & {
  lastExitReason: 'FORCED_BY_USER' | 'PROCESS_FINISHED';
};

const backupProcessInfo = {
  shceduled: false,
  foldersToBackup: 0,
  items: {} as Record<BackupFolder, number>,
  errors: {} as Record<BackupFolder, Array<string>>,
};

ipcMain.on('BACKUP_PROCESS_STARTED', (state: any) => {
  backupProcessInfo.shceduled = state.scheduled;
  backupProcessInfo.foldersToBackup = state.foldersToBackup.length;
  backupProcessStarted(state.scheduled, state.foldersToBackup.length);
});

ipcMain.on('BACKUP_PROCESS_FINISHED', (state: any) => {
  backupCompleted(state.scheduled, backupProcessInfo.foldersToBackup);
});

ipcMain.on(
  'BACKUP_ACTION_QUEUE_GENERATED',
  (
    _,
    {
      folderId,
      items,
    }: {
      folderId: number;
      items: number;
    }
  ) => {
    backupProcessInfo.items[folderId] = items;
    backupProcessInfo.errors = [];

    folderBackupStarted(backupProcessInfo.shceduled, items);
  }
);

ipcMain.on('BACKUP_COMPLETED', (folderId: any) => {
  const items = backupProcessInfo.items[folderId];
  const errors = backupProcessInfo.errors[folderId];

  folderBackupCompleted(backupProcessInfo.shceduled, items);

  if (errors?.length > 0) {
    backupError(backupProcessInfo.shceduled, items, errors);
  }
});

ipcMain.on('BACKUP_FATAL_ERROR', (_, { folderId, errorName }) => {
  const items = backupProcessInfo.items[folderId];

  backupError(backupProcessInfo.shceduled, items, errorName);
});

ipcMain.on('BACKUP_ISSUE', (_, issue: BackupProgressIssue) => {
  if (!backupProcessInfo.errors[issue.folderId]) {
    backupProcessInfo.errors[issue.folderId] = [];
  }

  backupProcessInfo.errors[issue.folderId].push(
    `${issue.errorName} error when ${issue}`
  );
});
