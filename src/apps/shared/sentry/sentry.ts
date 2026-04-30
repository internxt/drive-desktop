import { captureException, init, setUser } from '@sentry/electron/main';
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
    tags: {
      downloadSource: downloadFailureSource,
    },
    extra: {
      errorType: downloadFailureSource,
      fileUuid,
      contentsId,
      fileSize,
      destinationPath,
    },
  });
}

export async function captureSentryUploadError({
  error,
  fileUuid,
  fileSize,
  sourcePath,
  uploadSource,
}: {
  error: unknown;
  fileUuid: string;
  fileSize: number;
  sourcePath: string;
  uploadSource: 'backup-upload' | 'sync-upload';
}): Promise<void> {
  if (!isInitialized) return;
  captureException(error, {
    tags: {
      uploadSource,
    },
    extra: {
      errorType: uploadSource,
      fileUuid,
      fileSize,
      sourcePath,
    },
  });
}

export async function captureSentryPlaceholderSyncError({
  error,
  uuid,
  type,
  operationType,
}: {
  error: unknown;
  uuid: string;
  type: 'file' | 'folder';
  operationType: 'create' | 'update' | 'delete';
}): Promise<void> {
  if (!isInitialized) return;
  captureException(error, {
    tags: {
      'sync-placeholder': true,
    },
    extra: {
      errorType: 'sync-placeholder',
      uuid,
      type,
      operationType,
    },
  });
}

export async function captureSentryHydrationError({ error, path }: { error: unknown; path: string }): Promise<void> {
  if (!isInitialized) return;
  captureException(error, {
    tags: {
      'hydration-error': true,
    },
    extra: {
      path,
    },
  });
}

export async function captureSentryDehydrationError({ error, path }: { error: unknown; path: string }): Promise<void> {
  if (!isInitialized) return;
  captureException(error, {
    tags: {
      'dehydration-error': true,
    },
    extra: {
      path,
    },
  });
}

export async function captureSentryFolderError({
  error,
  uuid,
  operationType,
  path,
}: {
  error: unknown;
  uuid: string;
  operationType: 'create' | 'move' | 'delete';
  path: string;
}): Promise<void> {
  if (!isInitialized) return;
  captureException(error, {
    tags: {
      'folder-operation': operationType,
    },
    extra: {
      uuid,
      path,
    },
  });
}
