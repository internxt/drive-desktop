import { logger } from '@internxt/drive-desktop-core/build/backend';
import { DriveDesktopError } from '../../../context/shared/domain/errors/DriveDesktopError';
import { extractPropertyFromStringyfiedJson } from '../../../shared/extract-property-from-json';
import { INITIAL_RATE_LIMIT_DELAY_MS, INITIAL_SERVER_ERROR_DELAY_MS, MAX_BACKOFF_MS } from './constants';

export function parseRetryAfterMs(message?: string) {
  const retryAfterSeconds = extractPropertyFromStringyfiedJson(message ?? '', 'retry_after');
  return typeof retryAfterSeconds === 'number' ? retryAfterSeconds * 1000 : INITIAL_RATE_LIMIT_DELAY_MS;
}

export function mapEnvironmentUploadError(err: Error & { code?: unknown; status?: unknown }): DriveDesktopError {
  if (err.code === 'EACCES' || err.code === 'EPERM') {
    return new DriveDesktopError('ACTION_NOT_PERMITTED', err.message);
  }
  if (err.message === 'Max space used') {
    return new DriveDesktopError('NOT_ENOUGH_SPACE');
  }
  if (typeof err.status === 'number') {
    if (err.status === 429) {
      return new DriveDesktopError('RATE_LIMITED', String(parseRetryAfterMs(err.message)));
    }
    if (err.status >= 500) {
      return new DriveDesktopError('INTERNAL_SERVER_ERROR');
    }
  }
  return new DriveDesktopError('UNKNOWN', err.message);
}

function exponentialBackoff(attempts: number, baseMs: number) {
  return Math.min(baseMs * Math.pow(2, attempts - 1), MAX_BACKOFF_MS);
}

type Props = {
  tag: 'BACKUPS' | 'SYNC-ENGINE';
  context: string;
  path: string;
};

export function createTransientErrorHandler({ tag, context, path }: Props) {
  let transientAttempts = 0;

  return (error: DriveDesktopError): number | null => {
    if (error.cause === 'RATE_LIMITED' || error.cause === 'INTERNAL_SERVER_ERROR') {
      transientAttempts++;

      const baseDelayMs =
        error.cause === 'RATE_LIMITED'
          ? Number(error.message) || INITIAL_RATE_LIMIT_DELAY_MS
          : INITIAL_SERVER_ERROR_DELAY_MS;

      const delayMs = exponentialBackoff(transientAttempts, baseDelayMs);

      logger.debug({
        tag,
        msg: `[${context}]`,
        cause: error.cause,
        attempt: transientAttempts,
        delayMs,
        path,
      });

      return delayMs;
    }

    return null;
  };
}
