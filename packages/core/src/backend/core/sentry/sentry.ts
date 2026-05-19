import { init, setUser, captureException } from '@sentry/electron/main';
import { Primitive } from 'ts-essentials';

import { logger, type LoggerSentryErrorBody } from '../logger/logger';

let isInitialized = false;

const DEDUP_TTL_MS = 60 * 60 * 1000;
const sentryDedupCache = new Map<string, number>();

function generateFingerprint(tag?: string, message?: string) {
  return `${tag ?? 'UnknownTag'}|${message}`;
}

function shouldCaptureSentryError(fingerprint: string) {
  const now = Date.now();
  const entryTimestamp = sentryDedupCache.get(fingerprint);

  if (entryTimestamp !== undefined) {
    if (entryTimestamp < now + DEDUP_TTL_MS) {
      return false;
    }
  }

  sentryDedupCache.set(fingerprint, now);
  return true;
}

export function captureSentryException(rawBody: LoggerSentryErrorBody, sentryExtras?: Record<string, unknown>) {
  if (!isInitialized) return;

  const { tag, error, ...rest } = rawBody;
  const options = {
    tags: { tag },
    extra: { ...rest, ...sentryExtras },
  };

  const fingerprint = generateFingerprint(options.tags?.tag, rawBody.msg);

  if (shouldCaptureSentryError(fingerprint)) {
    const err = new Error(rawBody.msg);
    captureException(error ?? err, options);
  }
}

export function getSentryEnvironment() {
  if (process.env.NODE_ENV === 'production') {
    return process.env.SENTRY_ENVIRONMENT || 'prod';
  }
  return process.env.SENTRY_ENVIRONMENT || 'dev';
}

export function initSentry(tags: Record<string, Primitive>) {
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
    initialScope: { tags },
  });

  isInitialized = true;

  logger.debug({
    msg: 'Sentry initialized',
    environment,
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
