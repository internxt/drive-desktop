import { client } from './rudderstack-client';
import ConfigStore from '../config';
import packageJson from '../../../package.json';

const os = require('os');

function platformShortName(platform: string) {
  switch (platform) {
    case 'darwin':
      return 'MAC';
    case 'win32':
      return 'WIN';
    case 'linux':
      return 'LINUX';
    default:
      return '';
  }
}

const deviceContext = {
  app: {
    name: 'drive-desktop',
    version: packageJson.version,
  },
  os: {
    family: os.platform(),
    name: os.type(),
    short_name: platformShortName(process.platform),
    version: os.release(),
  },
};

export function applicationOpened() {
  const clientId = ConfigStore.get('clientId');

  client.identify(
    {
      anonymousId: clientId,
    },
    () => {
      client.track({
        anonymousId: clientId,
        event: 'Application Opened',
        context: deviceContext,
      });
    }
  );
}

export function userSignin() {
  const { uuid: userId, email } = ConfigStore.get('userData');

  client.identify(
    {
      userId,
      traits: {
        email,
      },
      context: deviceContext,
    },
    () => {
      client.track({
        userId,
        event: 'User Signin',
        properties: { email },
        context: deviceContext,
      });
    }
  );
}

export function userSigninFailed(email?: string) {
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
        anonymousId: clientId,
        event: 'User Signin Failed',
        properties: { email },
        context: deviceContext,
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
    context: deviceContext,
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
    context: deviceContext,
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
    context: deviceContext,
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
    context: deviceContext,
  });
}

export function syncFinished(numberOfItems: number) {
  const { uuid: userId } = ConfigStore.get('userData');

  client.track({
    userId,
    event: 'Sync Finished',
    properties: {
      number_of_items: numberOfItems,
    },
    context: deviceContext,
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
    context: deviceContext,
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
    context: deviceContext,
  });
}

export function backupError(
  scheduled: boolean,
  numberOfItems: number,
  issues: Array<string>
) {
  const { uuid: userId } = ConfigStore.get('userData');

  client.track({
    userId,
    event: 'Backup Error',
    properties: {
      scheduled,
      number_of_items: numberOfItems,
      message: issues,
    },
    context: deviceContext,
  });
}
