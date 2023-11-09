import { ipcMain } from 'electron';
import Logger from 'electron-log';

import { AccessResponse } from '../../renderer/pages/Login/service';
import { applicationOpened } from '../analytics/service';
import eventBus from '../event-bus';
import { setupRootFolder } from '../virutal-root-folder/service';
import { getWidget } from '../windows/widget';
import { createTokenSchedule } from './refresh-token';
import {
  canHisConfigBeRestored,
  encryptToken,
  getHeaders,
  getNewApiHeaders,
  getUser,
  logout,
  obtainToken,
  setCredentials,
} from './service';

let isLoggedIn: boolean;
setIsLoggedIn(!!getUser());

export function setIsLoggedIn(value: boolean) {
  isLoggedIn = value;

  getWidget()?.webContents.send('user-logged-in-changed', value);
}

export function getIsLoggedIn() {
  return isLoggedIn;
}

ipcMain.handle('is-user-logged-in', getIsLoggedIn);

ipcMain.handle('get-user', getUser);

ipcMain.handle('get-headers', (_, includeMnemonic) =>
  getHeaders(includeMnemonic)
);

ipcMain.handle('get-headers-for-new-api', () => getNewApiHeaders());

ipcMain.handle('get-new-token', () => obtainToken('newToken'));

ipcMain.handle('get-token', () => {
  return obtainToken('bearerToken');
});

export function onUserUnauthorized() {
  eventBus.emit('USER_WAS_UNAUTHORIZED');

  logout();
  Logger.info('[AUTH] User has been logged out because it was unauthorized');
  setIsLoggedIn(false);
}

ipcMain.on('user-is-unauthorized', onUserUnauthorized);

ipcMain.on('user-logged-in', async (_, data: AccessResponse) => {
  setCredentials(data.user, data.user.mnemonic, data.token, data.newToken);
  if (!canHisConfigBeRestored(data.user.uuid)) {
    await setupRootFolder();
  }

  setIsLoggedIn(true);
  eventBus.emit('USER_LOGGED_IN');
});

ipcMain.on('user-logged-out', () => {
  eventBus.emit('USER_LOGGED_OUT');

  setIsLoggedIn(false);

  logout();
});

eventBus.on('APP_IS_READY', async () => {
  if (!isLoggedIn) {
    return;
  }

  encryptToken();
  applicationOpened();
  await createTokenSchedule();
  eventBus.emit('USER_LOGGED_IN');
});
