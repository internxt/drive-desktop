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

export type GeneralIssueError = 'UNKNOWN_DEVICE_NAME' | 'WEBSOCKET_CONECTION_ERROR';

export type GeneralIssue = {
  tab: 'general';
  name: string;
  error: GeneralIssueError;
};

export type Issue = SyncIssue | BackupsIssue | GeneralIssue;

export function isGeneralIssue(issue: Issue): issue is GeneralIssue {
  return issue.tab === 'general';
}

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

export function getGeneralIssues(): Array<GeneralIssue> {
  return issues.filter(isGeneralIssue);
}

export function onGeneralIssuesChanged() {
  broadcastToWindows('general-issues-changed', getGeneralIssues());
}

export function clearGeneralIssues() {
  issues = issues.filter((i) => !isGeneralIssue(i));
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
    return !(isGeneralIssue(i) && i.error === issue.error);
  });

  if (issues.length < initialLength) {
    onGeneralIssuesChanged();
  }
}
