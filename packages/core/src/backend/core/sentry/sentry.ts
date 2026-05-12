import { init, setUser, captureException } from '@sentry/electron/main';
import { arch, release, version } from 'node:os';

import { logger } from '../logger/logger';

let isInitialized = false;

export function captureSentryException(exception: unknown, options?: Record<string, unknown>) {
  if (!isInitialized) return;
  captureException(exception, options);
}

export function getSentryEnvironment() {
  if (process.env.NODE_ENV === 'production') {
    return process.env.SENTRY_ENVIRONMENT || 'prod';
  }
  return process.env.SENTRY_ENVIRONMENT || 'dev';
}

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    logger.debug({ msg: 'Sentry DSN not configured, skipping initialization' });
    return;
  }

  const environment = getSentryEnvironment();

  init({
    dsn,
    environment,
    release: process.env.INTERNXT_VERSION,
    defaultIntegrations: false,
    integrations: (integrations) => {
      return integrations;
    },
    initialScope: {
      tags: {
        app: 'drive-desktop',
        arch: arch(),
        osRelease: release(),
        osVersion: version(),
        nodeVersion: process.versions.node,
      },
    },
  });

  isInitialized = true;

  logger.debug({
    msg: 'Sentry initialized',
    environment,
    release: process.env.INTERNXT_VERSION,
  });
}

export function setSentryUserContext(email: string, uuid: string) {
  if (!isInitialized) return;

  setUser({ email, id: uuid });

  logger.debug({
    msg: 'Sentry user context set',
    email,
    uuid,
  });
}

export function clearSentryUserContext() {
  if (!isInitialized) return;

  setUser(null);

  logger.debug({ msg: 'Sentry user context cleared' });
}
