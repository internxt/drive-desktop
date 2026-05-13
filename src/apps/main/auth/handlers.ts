import { clearSentryUserContext, setSentryUserContext } from '@internxt/drive-desktop-core/build/backend/core/sentry/sentry';
import Bottleneck from 'bottleneck';
import { ipcMain } from 'electron';
import { setMaxListeners } from 'node:events';
import { createWipClient } from '@/apps/shared/HttpClient/client';
import { logger } from '@/apps/shared/logger/logger';
import { AuthContext } from '@/apps/sync-engine/config';
import { Marketing } from '@/backend/features';
import { resetConfig } from '@/backend/features/auth/services/utils/reset-config';
import { saveConfig } from '@/backend/features/auth/services/utils/save-config';
import { BackupScheduler } from '../background-processes/backups/BackupScheduler/BackupScheduler';
import { spawnSyncEngineWorkers } from '../background-processes/sync-engine';
import electronStore from '../config';
import eventBus from '../event-bus';
import { clearLoggedPreloadIpc, setupLoggedPreloadIpc } from '../preload/ipc-main';
import { cleanAndStartRemoteNotifications } from '../realtime';
import { TokenScheduler } from '../token-scheduler/TokenScheduler';
import { User } from '../types';
import { openOnboardingWindow } from '../windows/onboarding';
import { getWidget, showFrontend } from '../windows/widget';
import { logout } from './logout';
import { getUser } from './service';

let user: User | null = null;

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
    saveConfig();
    resetConfig();
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
  setSentryUserContext(user.email, user.uuid);
  showFrontend();

  TokenScheduler.schedule();

  const abortController = new AbortController();
  setMaxListeners(0, abortController.signal);

  const { driveApiBottleneck, client } = createWipClient();
  const uploadBottleneck = new Bottleneck({ maxConcurrent: 4 });

  const ctx: AuthContext = {
    user,
    userUuid: user.uuid,
    abortController,
    driveApiBottleneck,
    uploadBottleneck,
    client,
    workspaceToken: '',
  };

  eventBus.once('USER_LOGGED_OUT', () => {
    logger.debug({ tag: 'AUTH', msg: 'Received logout event' });
    clearSentryUserContext();
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
