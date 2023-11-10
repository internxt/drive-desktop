import * as Sentry from '@sentry/electron/renderer';

/**
 * Reports an error to Sentry from the renderer process
 *
 * @param error The error to be reported
 * @param context The context to attach to the error such the userId, tags, boolean values...
 */
export const reportError = (
  error: unknown,
  context: Record<string, string> = {}
) => {
  Sentry.captureException(error, context);
};
