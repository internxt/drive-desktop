import { ipcMain } from 'electron';
import { ProcessInfoUpdatePayload, ProcessIssue } from '../../workers/types';
import { broadcastToWindows } from '../windows';

let processIssues: ProcessIssue[] = [];

ipcMain.handle('get-process-issues', () => processIssues);

function onProcessIssuesChanged() {
  broadcastToWindows('process-issues-changed', processIssues);
}

export function getProcessIssues() {
  return processIssues;
}

export function clearSyncIssues() {
  processIssues = processIssues.filter((issue) => issue.process === 'BACKUPS');
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
