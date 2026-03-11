import { ipcMain } from 'electron';
import eventBus from '../event-bus';
import { getWidget, showFrontend } from '../windows/widget';
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
import { openOnboardingWindow } from '../windows/onboarding';
import electronStore from '../config';
import { Marketing } from '@/backend/features';
import { User } from '../types';

let user: User | null;

export function setIsLoggedIn(value: User | null) {
  user = value;

  getWidget()?.webContents?.send('user-logged-in-changed', value);
}

export function isUserLoggedIn() {
  return user;
}

export function onUserUnauthorized() {
  logger.error({ tag: 'AUTH', msg: 'User has been logged out because it was unauthorized' });
  eventBus.emit('USER_LOGGED_OUT');
}

export function checkIfUserIsLoggedIn() {
  const user = getUser();

  if (!user) {
    logger.debug({ tag: 'AUTH', msg: 'User not logged in' });
    return;
  }

  const msToRenew = TokenScheduler.getMillisecondsToRenew();
  if (msToRenew === null || msToRenew <= 0) {
    logger.debug({ tag: 'AUTH', msg: 'User token is expired' });
    return;
  }

  return user;
}

export function setupAuthIpcHandlers() {
  ipcMain.on('USER_LOGGED_OUT', () => {
    logger.debug({ msg: 'Manual logout' });
    eventBus.emit('USER_LOGGED_OUT');
  });
}

export async function emitUserLoggedIn(user: User) {
  logger.debug({ tag: 'AUTH', msg: 'User logged in' });

  setIsLoggedIn(user);
  showFrontend();

  TokenScheduler.schedule();

  const abortController = new AbortController();
  setMaxListeners(0, abortController.signal);

  const { driveApiBottleneck, client } = createWipClient();
  const uploadBottleneck = new Bottleneck({ maxConcurrent: 4 });

  const ctx: AuthContext = {
    user,
    abortController,
    driveApiBottleneck,
    uploadBottleneck,
    client,
    workspaceToken: '',
  };

  eventBus.once('USER_LOGGED_OUT', () => {
    logger.debug({ tag: 'AUTH', msg: 'Received logout event' });
    clearLoggedPreloadIpc();
    TokenScheduler.stop();
    BackupScheduler.stop();
    logout({ ctx });
  });

  setupLoggedPreloadIpc({ ctx });
  cleanAndStartRemoteNotifications();

  const lastOnboardingShown = electronStore.get('lastOnboardingShown');
  if (!lastOnboardingShown) void openOnboardingWindow();

  BackupScheduler.start({ ctx });
  await spawnSyncEngineWorkers({ ctx });
  void Marketing.showNotifications();
}
