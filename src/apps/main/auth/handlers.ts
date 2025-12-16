import { ipcMain } from 'electron';
import eventBus from '../event-bus';
import { getWidget } from '../windows/widget';
import { refreshToken } from './refresh-token';
import { getUser } from './service';
import { logger } from '@/apps/shared/logger/logger';
import { cleanAndStartRemoteNotifications } from '../realtime';
import { ipcMainSyncEngine } from '@/apps/sync-engine/ipcMainSyncEngine';
import { AuthContext } from '@/backend/features/auth/utils/context';
import { spawnSyncEngineWorkers } from '../background-processes/sync-engine';
import { logout } from './logout';
import { TokenScheduler } from '../token-scheduler/TokenScheduler';

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
  logger.debug({ tag: 'AUTH', msg: 'User has been logged out because it was unauthorized' });
  eventBus.emit('USER_LOGGED_OUT');
}

export async function checkIfUserIsLoggedIn() {
  const user = getUser();

  if (!user) {
    logger.debug({ tag: 'AUTH', msg: 'User not logged in' });
    return false;
  }

  if (user.needLogout === undefined) {
    logger.debug({ tag: 'AUTH', msg: 'User needs logout' });
    return false;
  }

  return await refreshToken();
}

export function setupAuthIpcHandlers() {
  ipcMain.handle('is-user-logged-in', getIsLoggedIn);
  ipcMain.handle('get-user', getUser);

  ipcMainSyncEngine.on('USER_LOGGED_OUT', () => {
    eventBus.emit('USER_LOGGED_OUT');
  });
}

export async function emitUserLoggedIn() {
  const scheduler = new TokenScheduler();
  scheduler.schedule();

  const context: AuthContext = {
    abortController: new AbortController(),
  };

  eventBus.once('USER_LOGGED_OUT', async () => {
    scheduler.stop();
    await logout({ ctx: context });
  });

  eventBus.emit('USER_LOGGED_IN');
  cleanAndStartRemoteNotifications();
  await spawnSyncEngineWorkers({ context });
}
