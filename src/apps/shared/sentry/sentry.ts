import { captureException, captureMessage, init, setUser } from '@sentry/electron/main';
import { arch, release, version } from 'node:os';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { logger } from '../logger/logger';

let isInitialized = false;

export function getSentryEnvironment(): string {
  if (process.env.NODE_ENV === 'production') {
    return process.env.SENTRY_ENVIRONMENT || 'prod';
  }
  return process.env.SENTRY_ENVIRONMENT || 'dev';
}

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    logger.debug({ msg: 'Sentry DSN not configured, skipping initialization' });
    return;
  }

  const environment = getSentryEnvironment();

  init({
    dsn,
    environment,
    release: INTERNXT_VERSION,
    defaultIntegrations: false,
    integrations: (integrations) => {
      return integrations;
    },
    beforeSend(event) {
      logger.error({
        msg: 'Sentry event captured',
        eventId: event.event_id,
        environment: event.environment,
        release: event.release,
        exception: event.exception?.values?.[0],
      });
      return event;
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
    release: INTERNXT_VERSION,
  });
}

export function setSentryUserContext(email: string, uuid: string): void {
  if (!isInitialized) return;

  setUser({ email, id: uuid });

  logger.debug({
    msg: 'Sentry user context set',
    email,
    uuid,
  });
}

export function clearSentryUserContext(): void {
  if (!isInitialized) return;

  setUser(null);

  logger.debug({ msg: 'Sentry user context cleared' });
}

export async function captureSentryException(error: unknown, extra?: Record<string, unknown>): Promise<void> {
  if (!isInitialized) return;
  captureException(error, { extra });
}

export async function captureSentryMessage(message: string, extra?: Record<string, unknown>): Promise<void> {
  if (!isInitialized) return;
  captureMessage(message, { extra });
}

export async function captureSentryDownloadError({
  error,
  fileUuid,
  contentsId,
  fileSize,
  destinationPath,
  downloadFailureSource,
}: {
  error: unknown;
  fileUuid: string;
  contentsId: string;
  fileSize: number;
  destinationPath: string;
  downloadFailureSource: 'backup-download' | 'sync-download';
}): Promise<void> {
  if (!isInitialized) return;
  captureException(error, {
    extra: {
      downloadFailureSource,
      fileUuid,
      contentsId,
      fileSize,
      destinationPath,
    },
  });
}

export function triggerTestError(): void {
  throw new Error('Manual Sentry test error - This is an expected error for testing purposes');
}
