import { logger, type TLoggerBody, type LoggerSentryErrorBody } from '@internxt/drive-desktop-core/build/backend';

export { logger, TLoggerBody };

export function createLogger(root: Partial<TLoggerBody>) {
  return {
    debug: (body: TLoggerBody) => logger.debug({ ...root, ...body }),
    warn: (body: TLoggerBody) => logger.warn({ ...root, ...body }),
    error: (body: TLoggerBody) => logger.error({ ...root, ...body }),
    sentryError: (body: LoggerSentryErrorBody, sentryExtras?: Record<string, unknown>) =>
      logger.sentryError({ ...root, ...body }, sentryExtras),
  };
}
