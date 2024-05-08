import * as Sentry from '@sentry/electron/main';
import Logger from 'electron-log';

export function logAndTrackError(err: unknown) {
  Logger.error(err);
  Sentry.captureException(err);
}
