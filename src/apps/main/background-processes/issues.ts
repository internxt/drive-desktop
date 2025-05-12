import { ipcMain } from 'electron';
import { broadcastToWindows } from '../windows';
import { showNotEnoughSpaceNotification } from './process-issues';

type SyncIssue = {
  tab: 'sync';
  name: string;
  error: 'INVALID_WINDOWS_NAME' | 'DELETE_ERROR' | 'NOT_ENOUGH_SPACE';
};

export type Issue = SyncIssue;

export let issues: Issue[] = [];

function onIssuesChanged() {
  broadcastToWindows('issues-changed', issues);
}

export function addIssue(issue: Issue) {
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

export function clearIssues() {
  issues = [];
  onIssuesChanged();
}

export function setupIssueHandlers() {
  ipcMain.on('ADD_ISSUE', (_, issue: Issue) => addIssue(issue));
  ipcMain.handle('get-issues', () => issues);
}
