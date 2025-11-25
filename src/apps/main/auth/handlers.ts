import { ipcMain } from 'electron';
import eventBus from '../event-bus';
import { getWidget } from '../windows/widget';
import { createTokenSchedule, RefreshTokenError } from './refresh-token';
import { getUser } from './service';
import { logger } from '@/apps/shared/logger/logger';
import { cleanAndStartRemoteNotifications } from '../realtime';
import { getAuthHeaders } from './headers';
import { ipcMainSyncEngine } from '@/apps/sync-engine/ipcMainSyncEngine';
import { AuthContext } from '@/backend/features/auth/utils/context';
import { spawnSyncEngineWorkers } from '../background-processes/sync-engine';
import { logout } from './logout';
import { User } from '../types';

export function setIsLoggedIn(value: boolean) {
  getWidget()?.webContents?.send('user-logged-in-changed', value);
}

setIsLoggedIn(!!getUser());

export function getIsLoggedIn() {
  return !!getUser();
}

export function onUserUnauthorized() {
  logger.debug({ tag: 'AUTH', msg: 'User has been logged out because it was unauthorized' });
  eventBus.emit('USER_LOGGED_OUT');
}

export async function checkIfUserIsLoggedIn() {
  const user = getUser();

  if (user && user.needLogout === undefined) {
    logger.debug({ tag: 'AUTH', msg: 'User need logout is undefined' });
    eventBus.emit('USER_LOGGED_OUT');
  }

  if (!user) return;

  try {
    await createTokenSchedule();
  } catch (exc) {
    if (exc instanceof RefreshTokenError) return;
    else throw exc;
  }

  await emitUserLoggedIn({ user });
}

export function setupAuthIpcHandlers() {
  ipcMain.handle('is-user-logged-in', getIsLoggedIn);
  ipcMain.handle('get-user', getUser);
  ipcMain.handle('GET_HEADERS', getAuthHeaders);

  ipcMainSyncEngine.on('USER_LOGGED_OUT', () => {
    eventBus.emit('USER_LOGGED_OUT');
  });
}

export async function emitUserLoggedIn({ user }: { user: User }) {
  const ctx: AuthContext = {
    user,
    abortController: new AbortController(),
  };

  eventBus.once('USER_LOGGED_OUT', async () => {
    await logout({ ctx });
  });

  eventBus.emit('USER_LOGGED_IN');
  cleanAndStartRemoteNotifications();
  await spawnSyncEngineWorkers({ ctx });
}
