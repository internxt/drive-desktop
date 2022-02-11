import { ipcMain } from 'electron';
import { ProcessInfoUpdatePayload, ProcessIssue } from '../../workers/types';
import { broadcastToWindows } from '../windows';

let processIssues: ProcessIssue[] = [];

ipcMain.handle('get-process-issues', getProcessIssues);

function onProcessIssuesChanged() {
  broadcastToWindows('process-issues-changed', processIssues);
}

export function getProcessIssues() {
  return processIssues;
}

export function getSyncIssues() {
  return processIssues.filter((issue) => issue.process === 'SYNC');
}

export function clearSyncIssues() {
  processIssues = processIssues.filter((issue) => issue.process === 'BACKUPS');
  onProcessIssuesChanged();
}
export function clearBackupsIssues() {
  processIssues = processIssues.filter((issue) => issue.process === 'SYNC');
  onProcessIssuesChanged();
}

export function addProcessIssue(issue: ProcessIssue) {
  processIssues.push(issue);
  onProcessIssuesChanged();
}

ipcMain.on('SYNC_INFO_UPDATE', (_, payload: ProcessInfoUpdatePayload) => {
  if (
    [
      'PULL_ERROR',
      'RENAME_ERROR',
      'DELETE_ERROR',
      'METADATA_READ_ERROR',
    ].includes(payload.action)
  ) {
    addProcessIssue(payload as ProcessIssue);
  }
});

ipcMain.on('BACKUP_ISSUE', (_, issue: ProcessIssue) => {
  addProcessIssue(issue);
});
