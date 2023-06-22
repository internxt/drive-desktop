import { ipcMain } from 'electron';

import { identifyUserForErrorReporting, sendReport } from './service';
import eventBus from '../event-bus';
import configStore from '../config';
import Logger from 'electron-log';
ipcMain.handle('send-report', (_, report) => sendReport(report));

eventBus.on('USER_LOGGED_IN', () => {
  const userData = configStore.get('userData');
  if (!userData) {
    Logger.warn(
      'Cannot identify user for error tracking, user not found in config store'
    );
    return;
  }
  identifyUserForErrorReporting(userData);
  Logger.info('User identified for error reporting');
});

eventBus.on('USER_LOGGED_OUT', () => {
  identifyUserForErrorReporting(null);
});
