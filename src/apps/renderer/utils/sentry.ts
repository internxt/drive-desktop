import * as Sentry from '@sentry/electron/renderer';
import { User } from '../../main/types';

/**
 * Init Sentry in the renderer process
 * @param dsn Sentry DSN
 * @param enabled Whether Sentry should be enabled or not
 */
export const initSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enabled: true, // it is true but is using app.isPackaged from the main process
  });
  Sentry.captureMessage('Render process started');
};

/**
 * Reports an error to Sentry from the renderer process
 *
 * @param error The error to be reported
 * @param context The context to attach to the error such the userId, tags, boolean values...
 */
export const reportError = (error: unknown, context: Record<string, string> = {}) => {
  Sentry.captureException(error, context);
};

/**
 * Set user context in Sentry
 * @param user User object
 */
export const setUserContextForReports = (user: User) => {
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({
    email: user.email,
    id: user.uuid,
  });
};
