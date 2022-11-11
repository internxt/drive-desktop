import Logger from 'electron-log';
import { client } from './client';
import ConfigStore from '../config';

export function identify() {
  Logger.debug('[ANALYTICS]: identify called');
  const user = ConfigStore.get('userData');

  client.identify({
    userId: user.userId,
    traits: {
      name: user.name,
      email: user.email,
      plan: user.credit,
    },
  });
}

export function userSignin() {
  Logger.debug('[ANALYTICS]: userSignin called');
  const { uuid: userId, email } = ConfigStore.get('userData');

  client.identify(
    {
      userId,
      traits: {
        email,
      },
    },
    () => {
      client.track({
        userId,
        event: 'User Signin',
        properties: { email },
      });
    }
  );
}

export function userSigninFailded() {
  Logger.debug('[ANALYTICS]: userSigninFailded called');

  // TODO
}

export function userLogout() {
  Logger.debug('[ANALYTICS]: userLogout called');
  const { uuid: userId } = ConfigStore.get('userData');

  client.track({
    userId,
    event: 'User Logout',
  });
}

export function syncStarted(numberOfItems: number) {
  Logger.debug('[ANALYTICS]: syncStarted called with: ', numberOfItems);
  const { uuid: userId } = ConfigStore.get('userData');

  client.track({
    userId,
    event: 'Sync Started',
    properties: {
      number_of_items: numberOfItems,
    },
  });
}

export function syncPaused(numberOfItems: number) {
  Logger.debug('[ANALYTICS]: syncPaused called');
  const { uuid: userId } = ConfigStore.get('userData');

  client.track({
    userId,
    event: 'Sync Paused',
    properties: {
      number_of_items: numberOfItems,
    },
  });
}

export function syncBlocked(numberOfItems: number) {
  Logger.debug('[ANALYTICS]: syncBlocked called');
  const { uuid: userId } = ConfigStore.get('userData');

  client.track({
    userId,
    event: 'Sync Blocked',
    properties: {
      number_of_items: numberOfItems,
    },
  });
}

export function syncError(numberOfItems: number) {
  Logger.debug('[ANALYTICS]: syncError called');
  const { uuid: userId } = ConfigStore.get('userData');

  client.track({
    userId,
    event: 'Sync Error',
    properties: {
      number_of_items: numberOfItems,
    },
  });
}

export function backupStarted(scheduled: boolean, numberOfItems: number) {
  Logger.debug('[ANALYTICS]: backupStarted called');
  const { uuid: userId } = ConfigStore.get('userData');

  client.track({
    userId,
    event: 'Backup Started',
    properties: {
      scheduled,
      number_of_items: numberOfItems,
    },
  });
}

export function backupCompleted(scheduled: boolean, numberOfItems: number) {
  Logger.debug('[ANALYTICS]: backupCompleted called');
  const { uuid: userId } = ConfigStore.get('userData');

  client.track({
    userId,
    event: 'Backup Completed',
    properties: {
      scheduled,
      number_of_items: numberOfItems,
    },
  });
}

export function backupError(
  scheduled: boolean,
  numberOfItems: number,
  error: string
) {
  Logger.debug('[ANALYTICS]: backupError called');
  const { uuid: userId } = ConfigStore.get('userData');

  client.track({
    userId,
    event: 'Backup Error',
    properties: {
      scheduled,
      number_of_items: numberOfItems,
      message: error,
    },
  });
}
