import { client } from './rudderstack-client';
import ConfigStore from '../config';

export function identify() {
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

export function userSigninFailded(email?: string) {
  const clientId = ConfigStore.get('clientId');

  client.identify(
    {
      anonymousId: clientId,
      traits: {
        email,
      },
    },
    () => {
      client.track({
        event: 'User Signin Failed',
        properties: { email },
      });
    }
  );
}

export function userLogout() {
  const { uuid: userId } = ConfigStore.get('userData');

  client.track({
    userId,
    event: 'User Logout',
  });
}

export function syncStarted(numberOfItems: number) {
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
