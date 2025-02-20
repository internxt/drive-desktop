import { ipcMain, Notification } from 'electron';
import Logger from 'electron-log';;

import eventBus from '../event-bus';
import { broadcastToWindows } from '../windows';
import {
  ProcessIssue,
  GeneralIssue,
  ProcessInfoUpdatePayload,
} from '../../shared/types';
import path from 'path';

let lastDialogTime = 0; 

function showNotification(issue: ProcessIssue) {
  const now = Date.now();
  const TWO_MINUTES = 2 * 60 * 1000;

  if (now - lastDialogTime < TWO_MINUTES) {
    return;
  }
  lastDialogTime = now;

  const notification = new Notification({
    title: 'Internxt',
    body: 'Your account storage limit has been reached, for more details go to Settings -> Issues',
    icon: path.join(__dirname, 'assets', 'icon.ico')
  });

  notification.on('click', () => {
    Logger.info('El usuario hizo clic en la notificación');
  });

  notification.show();
}

let processIssues: ProcessIssue[] = [];
let generalIssues: GeneralIssue[] = [];

export function getGeneralIssues() {
  return generalIssues;
}
function getProcessIssues() {
  return processIssues;
}

ipcMain.handle('get-process-issues', getProcessIssues);
ipcMain.handle('get-general-issues', getGeneralIssues);

function onProcessIssuesChanged() {
  broadcastToWindows('process-issues-changed', processIssues);
}

function onGeneralIssuesChanged() {
  broadcastToWindows('general-issues-changed', generalIssues);
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

export function clearGeneralIssues() {
  generalIssues = [];
  onGeneralIssuesChanged();
}

export function addProcessIssue(issue: ProcessIssue) {
  Logger.warn(`Se ha añadido un issue: ${issue.errorName}`);
  if (issue.errorName === 'NOT_ENOUGH_SPACE') {
    // Se reemplaza el dialog por la notificación tipo toast
    showNotification(issue);
  }
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
