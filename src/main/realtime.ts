import watcher from '@parcel/watcher';
import { debounce } from 'lodash';
import logger from 'electron-log';
import { io, Socket } from 'socket.io-client';
import { getSyncStatus, startSyncProcess } from './background-processes/sync';
import configStore from './config';
import { getToken } from './auth/service';

import { broadcastToWindows } from './windows';
import eventBus from './event-bus';

let thereArePendingChanges = false;

export function getThereArePendingChanges() {
  return thereArePendingChanges;
}

export function clearPendingChanges() {
  thereArePendingChanges = false;
}

function tryToStartSyncProcess() {
  if (getSyncStatus() === 'STANDBY') startSyncProcess();
  else thereArePendingChanges = true;
}

eventBus.on('USER_LOGGED_OUT', clearPendingChanges);

// LOCAL TRIGGER

const LOCAL_DEBOUNCE_IN_MS = 2000;
let subscription: watcher.AsyncSubscription | undefined;

async function cleanAndStartLocalWatcher() {
  stopLocalWatcher();

  const debouncedCallback = debounce(
    tryToStartSyncProcess,
    LOCAL_DEBOUNCE_IN_MS
  );

  subscription = await watcher.subscribe(
    configStore.get('syncRoot'),
    () => getSyncStatus() === 'STANDBY' && debouncedCallback()
  );
}

export async function stopLocalWatcher() {
  if (subscription) {
    await subscription.unsubscribe();
    subscription = undefined;
  }
}

eventBus.on('USER_LOGGED_IN', cleanAndStartLocalWatcher);
eventBus.on('SYNC_ROOT_CHANGED', cleanAndStartLocalWatcher);
eventBus.on('USER_LOGGED_OUT', stopLocalWatcher);

// REMOTE TRIGGER

let socket: Socket | undefined;

function cleanAndStartRemoteNotifications() {
  stopRemoteNotifications();

  socket = io(process.env.NOTIFICATIONS_URL, {
    auth: {
      token: getToken(),
    },
    withCredentials: true,
  });

  socket.io.on('open', () => {
    socket?.io.engine.transport.on('pollComplete', () => {
      const request = socket?.io.engine.transport.pollXhr.xhr;
      const cookieHeader = request.getResponseHeader('set-cookie');
      if (!cookieHeader) {
        return;
      }
      cookieHeader.forEach((cookieString: string) => {
        if (cookieString.includes(`INGRESSCOOKIE=`)) {
          const cookie = cookieString.split(';')[0];
          if (socket)
            socket.io.opts.extraHeaders = {
              cookie,
            };
        }
      });
    });
  });

  socket.on('connect', () => {
    logger.log('Remote notifications connected');
  });

  socket.on('disconnect', (reason) => {
    logger.log('Remote notifications disconnected, reason: ', reason);
  });

  socket.on('connect_error', (error) => {
    logger.error('Remote notifications connect error: ', error);
  });

  socket.on('event', (data) => {
    logger.log('Notification received: ', JSON.stringify(data, null, 2));

    if (data.clientId !== configStore.get('clientId')) tryToStartSyncProcess();

    broadcastToWindows('remote-changes', undefined);
  });
}

function stopRemoteNotifications() {
  if (socket) {
    socket.close();
    socket = undefined;
  }
}

eventBus.on('USER_LOGGED_IN', cleanAndStartRemoteNotifications);
eventBus.on('USER_LOGGED_OUT', stopRemoteNotifications);
