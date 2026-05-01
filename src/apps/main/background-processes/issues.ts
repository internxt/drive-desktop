import { ipcMain } from 'electron';
import { broadcastToWindows } from '../windows';
import { showNotEnoughSpaceNotification } from './process-issues';

export type SyncIssue = {
  tab: 'sync';
  name: string;
  error: 'INVALID_WINDOWS_NAME' | 'FILE_SIZE_TOO_BIG' | 'CANNOT_REGISTER_VIRTUAL_DRIVE';
};

export type BackupsIssue = {
  tab: 'backups';
  name: string;
  folderUuid: string;
  error: 'FILE_SIZE_TOO_BIG' | 'FOLDER_ACCESS_DENIED';
};

export type GeneralIssue = {
  tab: 'general';
  name: string;
  error: 'NOT_ENOUGH_SPACE' | 'WEBSOCKET_CONNECTION_ERROR' | 'NETWORK_CONNECTIVITY_ERROR' | 'SERVER_INTERNAL_ERROR';
};

export type Issue = SyncIssue | BackupsIssue | GeneralIssue;

export let issues: Issue[] = [];

function onIssuesChanged() {
  broadcastToWindows({ name: 'issues-changed', data: issues });
}

function addIssue(issue: Issue) {
  const exists = issues.some((i) => {
    return i.tab === issue.tab && i.name === issue.name && i.error === issue.error;
  });

  if (!exists) {
    issues.push(issue);
    onIssuesChanged();

    if (issue.error === 'NOT_ENOUGH_SPACE') {
      showNotEnoughSpaceNotification();
    }
  }
}

export function addBackupsIssue(issue: Omit<BackupsIssue, 'tab'>) {
  addIssue({ tab: 'backups', ...issue });
}

export function addSyncIssue(issue: Omit<SyncIssue, 'tab'>) {
  addIssue({ tab: 'sync', ...issue });
}

export function addGeneralIssue(issue: Omit<GeneralIssue, 'tab'>) {
  addIssue({ tab: 'general', ...issue });
}

export function clearIssues() {
  issues = [];
  onIssuesChanged();
}

export function clearBackupsIssues() {
  issues = issues.filter((i) => i.tab !== 'backups');
  onIssuesChanged();
}

export function setupIssueHandlers() {
  ipcMain.handle('get-issues', () => issues);
}

function removeIssue(issue: Issue) {
  const initialLength = issues.length;

  issues = issues.filter((i) => {
    return !(i.tab === issue.tab && i.error === issue.error && i.name === issue.name);
  });

  if (issues.length < initialLength) {
    onIssuesChanged();
  }
}

export function removeSyncIssue(issue: Omit<SyncIssue, 'tab'>) {
  removeIssue({ ...issue, tab: 'sync' });
}

export function removeGeneralIssue(issue: Omit<GeneralIssue, 'tab'>) {
  removeIssue({ ...issue, tab: 'general' });
}
