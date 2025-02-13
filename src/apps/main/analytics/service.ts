import packageJson from '../../../../package.json';
import ConfigStore from '../config';
import { client } from './rudderstack-client';
import os from 'os';
import Logger from 'electron-log';
import {
  TrackedActions,
  ErrorContext,
} from '../../shared/IPC/events/sync-engine';

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
  Logger.debug('Tracked event', payload);

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
