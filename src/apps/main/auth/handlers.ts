import { ipcMain } from 'electron';
import eventBus from '../event-bus';
import { setupRootFolder } from '../virtual-root-folder/service';
import { getWidget } from '../windows/widget';
import { checkUserData, createTokenSchedule } from './refresh-token';
import { canHisConfigBeRestored, encryptToken, getUser, setCredentials } from './service';
import { logger } from '@/apps/shared/logger/logger';
import { initSyncEngine } from '../remote-sync/handlers';
import { cleanAndStartRemoteNotifications } from '../realtime';
import { getAuthHeaders } from './headers';
import { AccessResponse } from '@/apps/renderer/pages/Login/types';
import { ipcMainSyncEngine } from '@/apps/sync-engine/ipcMainSyncEngine';

let isLoggedIn: boolean;

function setIsLoggedIn(value: boolean) {
  isLoggedIn = value;

  getWidget()?.webContents?.send('user-logged-in-changed', value);
}

setIsLoggedIn(!!getUser());

export function getIsLoggedIn() {
  return isLoggedIn;
}

export function onUserUnauthorized() {
  eventBus.emit('USER_LOGGED_OUT');
  logger.debug({ tag: 'AUTH', msg: 'User has been logged out because it was unauthorized' });
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
  }

  if (!isLoggedIn) return;

  await checkUserData();
  encryptToken();
  await createTokenSchedule();
  await emitUserLoggedIn();
}

export function setupAuthIpcHandlers() {
  ipcMain.handle('is-user-logged-in', getIsLoggedIn);
  ipcMain.handle('get-user', getUser);
  ipcMain.handle('GET_HEADERS', () => getAuthHeaders());

  ipcMain.on('user-logged-in', async (_, data: AccessResponse) => {
    setCredentials({
      userData: data.user,
      bearerToken: data.token,
      newToken: data.newToken,
      password: data.password,
    });
    if (!canHisConfigBeRestored(data.user.uuid)) {
      setupRootFolder(data.user);
    }

    setIsLoggedIn(true);
    await emitUserLoggedIn();
  });

  ipcMainSyncEngine.on('USER_LOGGED_OUT', () => {
    eventBus.emit('USER_LOGGED_OUT');

    setIsLoggedIn(false);
  });
}

async function emitUserLoggedIn() {
  eventBus.emit('USER_LOGGED_IN');
  cleanAndStartRemoteNotifications();
  await initSyncEngine();
}
