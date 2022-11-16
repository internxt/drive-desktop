import { ipcMain } from 'electron';
import { ProcessIssue } from '../../workers/types';
import { backupStarted, backupCompleted, backupError } from './service';

const backupProcessInfo = {
  shceduled: false,
  totalActionsToPerform: 0,
  actionsPerformed: 0,
  errors: [] as Array<string>,
  lastBackup: {
    shceduled: false,
    totalActionsToPerform: 0,
    actionsPerformed: 0,
    errors: [] as Array<string>,
  },
};

ipcMain.on('SCHEDULED_BACKUP_PROCESS_STARTED', () => {
  backupProcessInfo.shceduled = true;
  backupProcessInfo.totalActionsToPerform = 0;
  backupProcessInfo.actionsPerformed = 0;
});

ipcMain.on('BACKUP_EXIT', () => {
  backupProcessInfo.lastBackup = backupProcessInfo;
  backupProcessInfo.shceduled = false;
  backupProcessInfo.totalActionsToPerform = 0;
  backupProcessInfo.actionsPerformed = 0;
  backupProcessInfo.errors = [];
});

ipcMain.on('BACKUP_ACTION_QUEUE_GENERATED', (_, numberOfActions: number) => {
  backupProcessInfo.totalActionsToPerform = numberOfActions;

  backupStarted(backupProcessInfo.shceduled, numberOfActions);
});

ipcMain.on('BACKUP_COMPLETED', () => {
  backupCompleted(
    backupProcessInfo.shceduled,
    backupProcessInfo.lastBackup.totalActionsToPerform
  );

  if (backupProcessInfo.errors.length > 0) {
    backupError(
      backupProcessInfo.shceduled,
      backupProcessInfo.totalActionsToPerform,
      backupProcessInfo.errors
    );
  }
});

ipcMain.on('BACKUP_FATAL_ERROR', (_, errorName) => {
  backupError(
    backupProcessInfo.shceduled,
    backupProcessInfo.totalActionsToPerform,
    errorName
  );
});

ipcMain.on('BACKUP_ISSUE', (_, issue: ProcessIssue) => {
  backupProcessInfo.errors.push(
    `${issue.errorName} error when ${issue.errorDetails.action}`
  );
});

ipcMain.on('BACKUP_ACTION_DONE', () => {
  backupProcessInfo.actionsPerformed++;
});
