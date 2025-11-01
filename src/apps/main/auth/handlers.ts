import { ipcMain } from 'electron';
import eventBus from '../event-bus';
import { getWidget } from '../windows/widget';
import { createTokenSchedule, RefreshTokenError } from './refresh-token';
import { getUser, restoreSavedConfig, setCredentials } from './service';
import { logger } from '@/apps/shared/logger/logger';
import { cleanAndStartRemoteNotifications } from '../realtime';
import { getAuthHeaders } from './headers';
import { AccessResponse } from '@/apps/renderer/pages/Login/types';
import { ipcMainSyncEngine } from '@/apps/sync-engine/ipcMainSyncEngine';
import { AuthContext } from '@/backend/features/auth/utils/context';
import { createAuthWindow } from '../windows/auth';
import { spawnSyncEngineWorkers } from '../background-processes/sync-engine';

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
  logger.debug({ tag: 'AUTH', msg: 'User has been logged out because it was unauthorized' });
  eventBus.emit('USER_LOGGED_OUT');
  setIsLoggedIn(false);
}

export async function checkIfUserIsLoggedIn() {
  const user = getUser();

  if (user && user.needLogout === undefined) {
    logger.debug({ tag: 'AUTH', msg: 'User need logout is undefined' });
    eventBus.emit('USER_LOGGED_OUT');
    setIsLoggedIn(false);
  }

  if (!isLoggedIn) return;

  try {
    await createTokenSchedule();
  } catch (exc) {
    if (exc instanceof RefreshTokenError) return;
    else throw exc;
  }

  await emitUserLoggedIn();
}

export function setupAuthIpcHandlers() {
  ipcMain.handle('is-user-logged-in', getIsLoggedIn);
  ipcMain.handle('get-user', getUser);
  ipcMain.handle('GET_HEADERS', getAuthHeaders);

  ipcMain.on('user-logged-in', async (_, data: AccessResponse) => {
    setCredentials({
      userData: data.user,
      newToken: data.newToken,
      password: data.password,
    });

    restoreSavedConfig({ uuid: data.user.uuid });

    setIsLoggedIn(true);
    await emitUserLoggedIn();
  });

  ipcMainSyncEngine.on('USER_LOGGED_OUT', () => {
    eventBus.emit('USER_LOGGED_OUT');
    setIsLoggedIn(false);
  });
}

async function emitUserLoggedIn() {
  const context: AuthContext = {
    abortController: new AbortController(),
  };

  eventBus.once('USER_LOGGED_OUT', async () => {
    context.abortController.abort();
    setIsLoggedIn(false);
    await createAuthWindow();
  });

  eventBus.emit('USER_LOGGED_IN');
  cleanAndStartRemoteNotifications();
  await spawnSyncEngineWorkers({ context });
}
