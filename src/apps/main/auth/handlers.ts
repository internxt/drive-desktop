import { ipcMain } from 'electron';
import Logger from 'electron-log';

import { AccessResponse } from '../../renderer/pages/Login/service';
import eventBus from '../event-bus';
import { clearRootVirtualDrive, setupRootFolder } from '../virtual-root-folder/service';
import { getWidget } from '../windows/widget';
import { checkUserData, createTokenSchedule } from './refresh-token';
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
import { logger } from '@/apps/shared/logger/logger';

let isLoggedIn: boolean;

export function setIsLoggedIn(value: boolean) {
  isLoggedIn = value;

  getWidget()?.webContents?.send('user-logged-in-changed', value);
}

setIsLoggedIn(!!getUser());

export function getIsLoggedIn() {
  return isLoggedIn;
}

export function onUserUnauthorized() {
  eventBus.emit('USER_WAS_UNAUTHORIZED');
  eventBus.emit('USER_LOGGED_OUT');

  logout();
  Logger.info('[AUTH] User has been logged out because it was unauthorized');
  setIsLoggedIn(false);
}

export async function checkIfUserIsLoggedIn() {
  const user = getUser();

  if (user && user.needLogout === undefined) {
    logger.debug({
      msg: 'User need logout is undefined',
    });
    eventBus.emit('USER_LOGGED_OUT');
    setIsLoggedIn(false);

    logout();
  }

  if (!isLoggedIn) return;

  await checkUserData();
  encryptToken();
  await createTokenSchedule();
  eventBus.emit('USER_LOGGED_IN');
}

export function setupAuthIpcHandlers() {
  ipcMain.handle('is-user-logged-in', getIsLoggedIn);
  ipcMain.handle('get-user', getUser);
  ipcMain.handle('get-headers', (_, includeMnemonic) => getHeaders(includeMnemonic));
  ipcMain.handle('GET_HEADERS', () => getNewApiHeaders());
  ipcMain.handle('get-new-token', () => obtainToken('newToken'));
  ipcMain.handle('get-token', () => obtainToken('bearerToken'));
  ipcMain.on('USER_IS_UNAUTHORIZED', onUserUnauthorized);

  ipcMain.on('user-logged-in', async (_, data: AccessResponse) => {
    setCredentials({
      userData: data.user,
      bearerToken: data.token,
      newToken: data.newToken,
      password: data.password,
    });
    if (!canHisConfigBeRestored(data.user.uuid)) {
      await setupRootFolder();
    }
    await clearRootVirtualDrive();

    setIsLoggedIn(true);
    eventBus.emit('USER_LOGGED_IN');
  });

  ipcMain.on('user-logged-out', () => {
    eventBus.emit('USER_LOGGED_OUT');

    setIsLoggedIn(false);

    logout();
  });
}
