import packageJson from '../../../package.json';
import ConfigStore from '../config';
import { client } from './rudderstack-client';
import os from 'os';
import Logger from 'electron-log';
import {
  TrackedWebdavServerErrorEvents,
  TrackedWebdavServerEvents,
  WebdavErrorContext,
} from '../../shared/IPC/events/webdav';

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

  // Sync can be blocked beacuse the user is unauthorized
  // In that case we don't have user data to track
  if (!userId) {
    return;
  }

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

export function backupProcessStarted(scheduled: boolean, totalFolders: number) {
  const { uuid: userId } = ConfigStore.get('userData');

  client.track({
    userId,
    event: 'Backup Started',
    properties: {
      scheduled,
      number_of_items: totalFolders,
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

export function folderBackupStarted(scheduled: boolean, numberOfItems: number) {
  const { uuid: userId } = ConfigStore.get('userData');

  client.track({
    userId,
    event: 'Folder Backup Started',
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

  client.track({
    userId,
    event: 'Folder Backup Completed',
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

export function trackWebdavEvent(
  event: TrackedWebdavServerEvents,
  properties: Record<string, any>
) {
  const { uuid: userId } = ConfigStore.get('userData');
  Logger.debug('Tracked event', {
    userId,
    event: event,
    properties,
    context: deviceContext,
  });

  client.track({
    userId,
    event: event,
    properties,
    context: deviceContext,
  });
}

export function trackWebdavError(
  event: TrackedWebdavServerErrorEvents,
  error: Error,
  context: WebdavErrorContext
) {
  const { uuid: userId } = ConfigStore.get('userData');

  const properties = {
    item: context.from,
    type: context.itemType,
    error: error.message,
  };

  client.track({
    userId,
    event: event,
    properties,
    context: deviceContext,
  });
}

export function sendFeedback(feedback: string) {
  const { uuid: userId } = ConfigStore.get('userData');

  client.track({
    event: 'Feedback Sent',
    userId,
    properties: {
      feature_flag: 'desktop',
      feedback: feedback,
    },
    context: deviceContext,
  });
}
