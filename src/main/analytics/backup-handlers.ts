import { ipcMain } from 'electron';
import Logger from 'electron-log';
import { ProcessIssue } from '../../workers/types';
import { backupStarted, backupCompleted, backupError } from './service';

const backupProcessInfo = {
  shceduled: false,
  totalActionsToPerform: 0,
  actionsPerformed: 0,
};

ipcMain.on('SCHEDULED_BACKUP_PROCESS_STARTED', () => {
  backupProcessInfo.shceduled = true;
  backupProcessInfo.totalActionsToPerform = 0;
  backupProcessInfo.actionsPerformed = 0;
});

ipcMain.on('BACKUP_EXIT', () => {
  backupProcessInfo.shceduled = false;
  backupProcessInfo.totalActionsToPerform = 0;
  backupProcessInfo.actionsPerformed = 0;
});

ipcMain.on('BACKUP_ACTION_QUEUE_GENERATED', (_, numberOfActions: number) => {
  backupProcessInfo.totalActionsToPerform = numberOfActions;

  backupStarted(backupProcessInfo.shceduled, numberOfActions);
});

ipcMain.on('BACKUP_COMPLETED', () =>
  backupCompleted(
    backupProcessInfo.shceduled,
    backupProcessInfo.totalActionsToPerform
  )
);

ipcMain.on('BACKUP_FATAL_ERROR', (_, errorName) => {
  backupError(
    backupProcessInfo.shceduled,
    backupProcessInfo.totalActionsToPerform,
    errorName
  );
});

ipcMain.on('BACKUP_ISSUE', (_, issue: ProcessIssue) => {
  backupError(
    backupProcessInfo.shceduled,
    backupProcessInfo.totalActionsToPerform,
    issue.errorName
  );
});

ipcMain.on('BACKUP_ACTION_DONE', () => {
  backupProcessInfo.actionsPerformed++;
});
