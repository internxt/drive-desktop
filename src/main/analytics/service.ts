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
      client.track('Application Opened', {
        anonymousId: clientId,
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
      client.track('User Signin', {
        userId,
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
      client.track('User Signin Failed', {
        anonymousId: clientId,
        properties: { email },
        context: deviceContext,
      });
    }
  );
}

export function userLogout() {
  const { uuid: userId } = ConfigStore.get('userData');

  client.track('User Logout', {
    userId,
  });
}

export function syncStarted(numberOfItems: number) {
  const { uuid: userId } = ConfigStore.get('userData');

  client.track('Sync Started', {
    userId,
    properties: {
      number_of_items: numberOfItems,
    },
    context: deviceContext,
  });
}

export function syncPaused(numberOfItems: number) {
  const { uuid: userId } = ConfigStore.get('userData');

  client.track('Sync Paused', {
    userId,
    properties: {
      number_of_items: numberOfItems,
    },
    context: deviceContext,
  });
}

export function syncBlocked(numberOfItems: number) {
  const { uuid: userId } = ConfigStore.get('userData');

  // Sync can be blocked beacuse the user is unauthorized
  // In that case we don't have user data to track
  if (!userId) return;

  client.track('Sync Blocked', {
    userId,
    properties: {
      number_of_items: numberOfItems,
    },
    context: deviceContext,
  });
}

export function syncError(numberOfItems: number) {
  const { uuid: userId } = ConfigStore.get('userData');

  client.track('Sync Error', {
    userId,
    properties: {
      number_of_items: numberOfItems,
    },
    context: deviceContext,
  });
}

export function syncFinished(numberOfItems: number) {
  const { uuid: userId } = ConfigStore.get('userData');

  client.track('Sync Finished', {
    userId,
    properties: {
      number_of_items: numberOfItems,
    },
    context: deviceContext,
  });
}

export function backupProcessStarted(scheduled: boolean, totalFolders: number) {
  const { uuid: userId } = ConfigStore.get('userData');

  client.track('Backup Started', {
    userId,
    properties: {
      scheduled,
      number_of_items: totalFolders,
    },
    context: deviceContext,
  });
}

export function backupCompleted(scheduled: boolean, numberOfItems: number) {
  const { uuid: userId } = ConfigStore.get('userData');

  client.track('Backup Completed', {
    userId,
    properties: {
      scheduled,
      number_of_items: numberOfItems,
    },
    context: deviceContext,
  });
}

export function folderBackupStarted(scheduled: boolean, numberOfItems: number) {
  const { uuid: userId } = ConfigStore.get('userData');

  client.track('Folder Backup Started', {
    userId,
    properties: {
      scheduled,
      number_of_items: numberOfItems,
    },
    context: deviceContext,
  });
}

export function folderBackupCompleted(
  scheduled: boolean,
  numberOfItems: number
) {
  const { uuid: userId } = ConfigStore.get('userData');

  client.track('Folder Backup Completed', {
    userId,
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

  client.track('Backup Error', {
    userId,
    properties: {
      scheduled,
      number_of_items: numberOfItems,
      message: issues,
    },
    context: deviceContext,
  });
}
