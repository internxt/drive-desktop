import { Notification } from 'electron';
import Logger from 'electron-log';

import eventBus from '../event-bus';
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

  /**
   * v2.5.3 Daniel Jiménez
   * TODO: Notification is not working
   */
  notification.show();
}

eventBus.on('USER_LOGGED_OUT', () => {
  clearIssues();
});
