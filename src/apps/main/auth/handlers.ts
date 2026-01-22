import { ipcMain } from 'electron';
import { logger } from '@internxt/drive-desktop-core/build/backend';

import eventBus from '../event-bus';
import { getWidget } from '../windows/widget';
import { createTokenScheduleWithRetry } from './refresh-token/create-token-schedule-with-retry';
import { encryptToken, getHeaders, getNewApiHeaders, getUser, logout, obtainToken, tokensArePresent } from './service';

let isLoggedIn = false;

if (getUser() && tokensArePresent()) {
  setIsLoggedIn(true);
}

export function setIsLoggedIn(value: boolean) {
  isLoggedIn = value;

  getWidget()?.webContents.send('user-logged-in-changed', value);
}

export function getIsLoggedIn() {
  return isLoggedIn;
}

ipcMain.handle('is-user-logged-in', getIsLoggedIn);

ipcMain.handle('get-user', getUser);

ipcMain.handle('get-headers', (_, includeMnemonic) => getHeaders(includeMnemonic));

ipcMain.handle('get-headers-for-new-api', () => getNewApiHeaders());

ipcMain.handle('get-new-token', () => obtainToken('newToken'));

ipcMain.handle('get-token', () => {
  return obtainToken('bearerToken');
});

export function onUserUnauthorized() {
  eventBus.emit('USER_WAS_UNAUTHORIZED');

  logout();
  logger.debug({
    msg: '[AUTH] User has been logged out because it was unauthorized',
  });
  setIsLoggedIn(false);
}

ipcMain.on('user-is-unauthorized', onUserUnauthorized);

ipcMain.on('user-logged-out', () => {
  eventBus.emit('USER_LOGGED_OUT');

  setIsLoggedIn(false);

  logout();
});

eventBus.on('APP_IS_READY', async (): Promise<void> => {
  if (isLoggedIn) {
    encryptToken();
    await createTokenScheduleWithRetry();
    eventBus.emit('USER_LOGGED_IN');
  }
});
