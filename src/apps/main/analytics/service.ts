import packageJson from '../../../../package.json';
import ConfigStore from '../config';
import { client } from './rudderstack-client';
import os from 'os';
import Logger from 'electron-log';
import {
  TrackedActions,
  ErrorContext,
} from '../../shared/IPC/events/sync-engine';
import {
  VirtualDriveError,
  isVirtualDriveFolderError,
} from '../../../shared/issues/VirtualDriveError';
import { VirtualDriveIssue } from '../../../shared/issues/VirtualDriveIssue';

const virtualDriveErrorToTrackedActionsMap = new Map<
  VirtualDriveError,
  TrackedActions
>([
  ['UPLOAD_ERROR', 'Upload Error'],
  ['DOWNLOAD_ERROR', 'Download Error'],
  ['RENAME_ERROR', 'Rename Error'],
  ['DELETE_ERROR', 'Delete Error'],
  // FOLDERS
  ['FOLDER_RENAME_ERROR', 'Rename Error'],
  ['FOLDER_CREATE_ERROR', 'Upload Error'],
]);

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

export function userSigning() {
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
        event: 'User Signing',
        properties: { email },
        context: deviceContext,
      });
    }
  );
}

export function userSigningFailed(email?: string) {
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
        event: 'User Signing Failed',
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

export function trackEvent(
  event: TrackedActions,
  properties: Record<string, any>
) {
  const userData = ConfigStore.get('userData');
  const clientId = ConfigStore.get('clientId');

  const payload = {
    userId: userData ? userData.uuid : undefined,
    anonymousId: userData ? undefined : clientId,
    event: event,
    properties,
    context: deviceContext,
  };
  Logger.debug('Tracked event', event);

  client.track(payload);
}

export function trackError(
  event: TrackedActions,
  error: Error,
  context?: ErrorContext
) {
  const userData = ConfigStore.get('userData');
  const clientId = ConfigStore.get('clientId');

  const properties = {
    item: context?.from ?? 'NO_ITEM_IN_CONTEXT',
    type: context?.itemType ?? 'NO_ITEM_TYPE_IN_CONTEXT',
    error: error.message,
  };

  const payload = {
    userId: userData ? userData.uuid : undefined,
    anonymousId: userData ? undefined : clientId,
    event: event,
    properties,
    context: deviceContext,
  };

  client.track(payload);
}

export function trackVirtualDriveError(error: VirtualDriveIssue) {
  const event = virtualDriveErrorToTrackedActionsMap.get(error.error);

  if (!event) {
    // Error has no event associated to be tracked
    return;
  }

  const userData = ConfigStore.get('userData');
  const clientId = ConfigStore.get('clientId');

  const properties = {
    item: error.name,
    error: error.cause,
    type: isVirtualDriveFolderError(error.error) ? 'Folder' : 'File',
  };

  const payload = {
    userId: userData ? userData.uuid : undefined,
    anonymousId: userData ? undefined : clientId,
    event: event,
    properties,
    context: deviceContext,
  };

  client.track(payload);
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
