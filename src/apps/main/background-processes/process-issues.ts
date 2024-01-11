import { ipcMain } from 'electron';

import eventBus from '../event-bus';
import { broadcastToWindows } from '../windows';
import {
  ProcessIssue,
  GeneralIssue,
  ProcessInfoUpdatePayload,
} from '../../shared/types';

let processIssues: ProcessIssue[] = [];
let generalIssues: GeneralIssue[] = [];

ipcMain.handle('get-process-issues', getProcessIssues);
ipcMain.handle('get-general-issues', getGeneralIssues);

function onProcessIssuesChanged() {
  broadcastToWindows('process-issues-changed', processIssues);
}

function onGeneralIssuesChanged() {
  broadcastToWindows('general-issues-changed', generalIssues);
}

function getProcessIssues() {
  return processIssues;
}

export function getSyncIssues() {
  return processIssues.filter((issue) => issue.process === 'SYNC');
}

export function getGeneralIssues() {
  return generalIssues;
}

export function clearSyncIssues() {
  processIssues = processIssues.filter((issue) => issue.process === 'BACKUPS');
  onProcessIssuesChanged();
}
export function clearBackupsIssues() {
  processIssues = processIssues.filter((issue) => issue.process === 'SYNC');
  onProcessIssuesChanged();
}

export function clearGeneralIssues() {
  generalIssues = [];
  onGeneralIssuesChanged();
}

export function addProcessIssue(issue: ProcessIssue) {
  processIssues.push(issue);
  onProcessIssuesChanged();
}

export function addGeneralIssue(issue: GeneralIssue) {
  generalIssues.push(issue);
  onGeneralIssuesChanged();
}

ipcMain.on('SYNC_INFO_UPDATE', (_, payload: ProcessInfoUpdatePayload) => {
  if (
    [
      'PULL_ERROR',
      'RENAME_ERROR',
      'DELETE_ERROR',
      'METADATA_READ_ERROR',
      'UPLOAD_ERROR',
    ].includes(payload.action)
  ) {
    addProcessIssue(payload as ProcessIssue);
  }
});

ipcMain.on('SYNC_PROBLEM', (_, payload) => {
  addProcessIssue({
    action: 'GENERATE_TREE',
    process: 'SYNC',
    errorName: 'DUPLICATED_NODE',
    kind: 'LOCAL',
    name: payload.additionalData.name,
  });
});

ipcMain.on('BACKUP_ISSUE', (_, issue: ProcessIssue) => {
  addProcessIssue(issue);
});

eventBus.on('USER_LOGGED_OUT', () => {
  clearSyncIssues();
  clearBackupsIssues();
  clearGeneralIssues();
});

eventBus.on('USER_WAS_UNAUTHORIZED', () => {
  clearSyncIssues();
  clearBackupsIssues();
  clearGeneralIssues();
});
