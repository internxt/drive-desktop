import { captureException, init, setUser } from '@sentry/electron/main';
import { arch, release, version } from 'node:os';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { logger } from '../logger/logger';

let isInitialized = false;
let isCapturing = false;

const errorFingerprints = new Map<string, number>();
const FINGERPRINT_TTL = 60000;
const MAX_FINGERPRINT_AGE = 60000;

function generateFingerprint(error: unknown, operation: string, identifier: string): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorType = error instanceof Error ? error.constructor.name : 'Unknown';
  return `${operation}:${errorType}:${identifier}:${errorMessage}`.slice(0, 200);
}

function shouldCaptureError(fingerprint: string): boolean {
  const now = Date.now();
  const lastCapture = errorFingerprints.get(fingerprint);

  if (lastCapture && now - lastCapture < FINGERPRINT_TTL) {
    return false;
  }

  errorFingerprints.set(fingerprint, now);

  for (const [key, timestamp] of errorFingerprints.entries()) {
    if (now - timestamp > MAX_FINGERPRINT_AGE) {
      errorFingerprints.delete(key);
    }
  }

  return true;
}

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
      if (isCapturing) {
        logger.warn({ msg: 'Recursive Sentry capture detected, skipping', eventId: event.event_id });
        return null;
      }

      logger.error({
        msg: 'Sentry event captured',
        eventId: event.event_id,
        environment: event.environment,
        release: event.release,
        exception: event.exception?.values?.[0],
        fingerprint: event.fingerprint,
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

export async function captureSentryException(
  error: unknown,
  extra?: Record<string, unknown>,
  options?: { fingerprint?: string; preventRecursion?: boolean },
): Promise<void> {
  if (!isInitialized) return;

  if (options?.preventRecursion && isCapturing) {
    return;
  }

  if (options?.fingerprint && !shouldCaptureError(options.fingerprint)) {
    return;
  }

  isCapturing = true;
  try {
    captureException(error, { extra });
  } finally {
    isCapturing = false;
  }
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

  const fingerprint = generateFingerprint(error, 'download', fileUuid);
  if (!shouldCaptureError(fingerprint)) return;

  isCapturing = true;
  try {
    captureException(error, {
      fingerprint: [fingerprint],
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
  } finally {
    isCapturing = false;
  }
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

  const fingerprint = generateFingerprint(error, 'upload', fileUuid);
  if (!shouldCaptureError(fingerprint)) return;

  isCapturing = true;
  try {
    captureException(error, {
      fingerprint: [fingerprint],
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
  } finally {
    isCapturing = false;
  }
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

  const fingerprint = generateFingerprint(error, 'placeholder-sync', `${type}:${operationType}:${uuid}`);
  if (!shouldCaptureError(fingerprint)) return;

  isCapturing = true;
  try {
    captureException(error, {
      fingerprint: [fingerprint],
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
  } finally {
    isCapturing = false;
  }
}

export async function captureSentryHydrationError({ error, path }: { error: unknown; path: string }): Promise<void> {
  if (!isInitialized) return;

  const fingerprint = generateFingerprint(error, 'hydration', path);
  if (!shouldCaptureError(fingerprint)) return;

  isCapturing = true;
  try {
    captureException(error, {
      fingerprint: [fingerprint],
      tags: {
        'hydration-error': true,
      },
      extra: {
        path,
      },
    });
  } finally {
    isCapturing = false;
  }
}

export async function captureSentryDehydrationError({ error, path }: { error: unknown; path: string }): Promise<void> {
  if (!isInitialized) return;

  const fingerprint = generateFingerprint(error, 'dehydration', path);
  if (!shouldCaptureError(fingerprint)) return;

  isCapturing = true;
  try {
    captureException(error, {
      fingerprint: [fingerprint],
      tags: {
        'dehydration-error': true,
      },
      extra: {
        path,
      },
    });
  } finally {
    isCapturing = false;
  }
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

  const fingerprint = generateFingerprint(error, `folder-${operationType}`, uuid);
  if (!shouldCaptureError(fingerprint)) return;

  isCapturing = true;
  try {
    captureException(error, {
      fingerprint: [fingerprint],
      tags: {
        'folder-operation': operationType,
      },
      extra: {
        uuid,
        path,
      },
    });
  } finally {
    isCapturing = false;
  }
}
