import { ipcMain } from 'electron';
import eventBus from '../event-bus';
import { broadcastToWindows } from '../windows';
import { AppIssue } from '../../../shared/issues/AppIssue';

let issues: AppIssue[] = [];

function getAppIssues() {
  return issues;
}

function onGeneralIssuesChanged() {
  broadcastToWindows('general-issues-changed', issues);
}

export function addAppIssue(issue: AppIssue) {
  issues.push(issue);
  onGeneralIssuesChanged();
}

function clearAppIssues() {
  issues = [];
  onGeneralIssuesChanged();
}

ipcMain.handle('get-general-issues', getAppIssues);

eventBus.on('USER_LOGGED_OUT', () => {
  clearAppIssues();
});

eventBus.on('USER_WAS_UNAUTHORIZED', () => {
  clearAppIssues();
});
