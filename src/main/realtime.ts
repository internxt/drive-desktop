import watcher from '@parcel/watcher';
import { debounce } from 'lodash';
import logger from 'electron-log';
import { io } from 'socket.io-client';
import { getSyncStatus, startSyncProcess } from './background-processes/sync';
import configStore from './config';

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

// LOCAL TRIGGER

function onLocalChange() {
  if (getSyncStatus() === 'STANDBY') tryToStartSyncProcess();
}

const LOCAL_DEBOUNCE_IN_MS = 2000;
let subscription: watcher.AsyncSubscription;

export async function cleanAndStartLocalWatcher() {
  if (subscription) await subscription.unsubscribe();

  subscription = await watcher.subscribe(
    configStore.get('syncRoot'),
    debounce(onLocalChange, LOCAL_DEBOUNCE_IN_MS)
  );
}

cleanAndStartLocalWatcher();

// REMOTE TRIGGER

const socket = io(process.env.NOTIFICATIONS_URL, {
  auth: {
    token: configStore.get('bearerToken'),
  },
});

socket.on('connect', () => {
  logger.log('Remote notifications connected');
});

socket.on('disconnect', () => {
  logger.log('Remote notifications disconnected');
});

socket.on('event', (data) => {
  logger.log('Notification received: ', JSON.stringify(data, null, 2));
  tryToStartSyncProcess();
});
