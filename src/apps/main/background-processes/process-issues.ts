import { ipcMain, Notification } from 'electron';
import Logger from 'electron-log';

import eventBus from '../event-bus';
import { broadcastToWindows } from '../windows';
import { GeneralIssue } from '../../shared/types';
import path from 'path';
import { clearIssues } from './issues';

let lastDialogTime = 0;

export function showNotEnoughSpaceNotification() {
  const now = Date.now();
  const TWO_MINUTES = 2 * 60 * 1000;

  if (now - lastDialogTime < TWO_MINUTES) {
    return;
  }
  lastDialogTime = now;

  const notification = new Notification({
    title: 'Internxt',
    body: 'Your account storage limit has been reached, for more details go to Settings -> Issues',
    icon: path.join(process.cwd(), 'assets', 'icon.ico'),
  });

  notification.on('click', () => {
    Logger.info('The users clicked on the notification');
  });

  notification.show();
}

let generalIssues: GeneralIssue[] = [];

export function getGeneralIssues() {
  return generalIssues;
}

ipcMain.handle('get-general-issues', getGeneralIssues);

function onGeneralIssuesChanged() {
  broadcastToWindows('general-issues-changed', generalIssues);
}

export function clearGeneralIssues() {
  generalIssues = [];
  onGeneralIssuesChanged();
}

export function addGeneralIssue(issue: GeneralIssue) {
  generalIssues.push(issue);
  onGeneralIssuesChanged();
}

eventBus.on('USER_LOGGED_OUT', () => {
  clearGeneralIssues();
  clearIssues();
});

eventBus.on('USER_WAS_UNAUTHORIZED', () => {
  clearGeneralIssues();
  clearIssues();
});
