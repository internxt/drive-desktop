import { ipcMain } from 'electron';
import eventBus from '../event-bus';
import { getWidget } from '../windows/widget';
import { refreshToken } from './refresh-token';
import { getUser } from './service';
import { logger } from '@/apps/shared/logger/logger';
import { cleanAndStartRemoteNotifications } from '../realtime';
import { AuthContext } from '@/apps/sync-engine/config';
import { spawnSyncEngineWorkers } from '../background-processes/sync-engine';
import { logout } from './logout';
import { TokenScheduler } from '../token-scheduler/TokenScheduler';
import { BackupScheduler } from '../background-processes/backups/BackupScheduler/BackupScheduler';
import { clearLoggedPreloadIpc, setupLoggedPreloadIpc } from '../preload/ipc-main';
import { setMaxListeners } from 'node:events';
import { createWipClient } from '@/apps/shared/HttpClient/client';
import Bottleneck from 'bottleneck';

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
  logger.error({ tag: 'AUTH', msg: 'User has been logged out because it was unauthorized' });
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
  ipcMain.on('USER_LOGGED_OUT', () => {
    eventBus.emit('USER_LOGGED_OUT');
  });
}

export async function emitUserLoggedIn() {
  logger.debug({ tag: 'AUTH', msg: 'User logged in' });

  const scheduler = new TokenScheduler();
  scheduler.schedule();

  const abortController = new AbortController();
  setMaxListeners(0, abortController.signal);

  const { wipBottleneck, client } = createWipClient();
  const uploadBottleneck = new Bottleneck({ maxConcurrent: 4 });

  const ctx: AuthContext = {
    abortController,
    wipBottleneck,
    uploadBottleneck,
    client,
    workspaceToken: '',
  };

  eventBus.once('USER_LOGGED_OUT', async () => {
    logger.debug({ tag: 'AUTH', msg: 'Received logout event' });
    clearLoggedPreloadIpc();
    scheduler.stop();
    BackupScheduler.stop();
    await logout({ ctx });
  });

  setupLoggedPreloadIpc({ ctx });
  eventBus.emit('USER_LOGGED_IN');
  cleanAndStartRemoteNotifications();
  BackupScheduler.start({ ctx });
  await spawnSyncEngineWorkers({ ctx });
}
