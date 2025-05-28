import { ipcMain } from 'electron';
import { broadcastToWindows } from '../windows';
import { showNotEnoughSpaceNotification } from './process-issues';
import { ipcMainSyncEngine } from '@/apps/sync-engine/ipcMainSyncEngine';

export type SyncIssue = {
  tab: 'sync';
  name: string;
  error: 'INVALID_WINDOWS_NAME' | 'DELETE_ERROR' | 'NOT_ENOUGH_SPACE';
};

export type BackupsIssue = {
  tab: 'backups';
  name: string;
  error:
    | 'FOLDER_ACCESS_DENIED'
    | 'CREATE_FOLDER_FAILED'
    | 'FOLDER_DOES_NOT_EXIST'
    | 'PARENT_FOLDER_DOES_NOT_EXIST'
    | 'ROOT_FOLDER_DOES_NOT_EXIST'
    | 'NOT_ENOUGH_SPACE'
    | 'UNKNOWN';
};

export type GeneralIssue = {
  tab: 'general';
  name: string;
  error: 'UNKNOWN_DEVICE_NAME' | 'WEBSOCKET_CONNECTION_ERROR';
};

export type Issue = SyncIssue | BackupsIssue | GeneralIssue;

export let issues: Issue[] = [];

function addIssueWithCallback(issue: Issue, callback?: () => void) {
  const exists = issues.some((i) => {
    return i.tab === issue.tab && i.name === issue.name && i.error === issue.error;
  });

  if (!exists) {
    issues.push(issue);
    if (callback) callback();
  }
}

function onIssuesChanged() {
  broadcastToWindows('issues-changed', issues);
}

function addIssue(issue: Issue) {
  addIssueWithCallback(issue, () => {
    onIssuesChanged();
    if (issue.error === 'NOT_ENOUGH_SPACE') {
      showNotEnoughSpaceNotification();
    }
  });
}

export function addBackupsIssue(issue: Omit<BackupsIssue, 'tab'>) {
  addIssue({ tab: 'backups', ...issue });
}

export function addSyncIssue(issue: Omit<SyncIssue, 'tab'>) {
  addIssue({ tab: 'sync', ...issue });
}

export function clearIssues() {
  issues = [];
  onIssuesChanged();
}

export function clearBackupsIssues() {
  issues = issues.filter((i) => i.tab !== 'backups');
  onIssuesChanged();
}

export function getGeneralIssues() {
  return issues.filter((issue) => issue.tab === 'general');
}

export function onGeneralIssuesChanged() {
  broadcastToWindows('general-issues-changed', getGeneralIssues());
}

export function clearGeneralIssues() {
  issues = issues.filter((i) => i.tab !== 'general');
  onGeneralIssuesChanged();
}

export function setupIssueHandlers() {
  ipcMainSyncEngine.on('ADD_SYNC_ISSUE', (_, issue) => addSyncIssue(issue));
  ipcMain.handle('get-issues', () => issues);
  ipcMain.handle('get-general-issues', getGeneralIssues);
}

export function addGeneralIssue(issue: Omit<GeneralIssue, 'tab'>) {
  addIssueWithCallback({ tab: 'general', ...issue }, onGeneralIssuesChanged);
}

export function removeGeneralIssue(issue: Omit<GeneralIssue, 'tab'>) {
  const initialLength = issues.length;

  issues = issues.filter((i) => {
    return !(i.tab === 'general' && i.error === issue.error);
  });

  if (issues.length < initialLength) {
    onGeneralIssuesChanged();
  }
}
