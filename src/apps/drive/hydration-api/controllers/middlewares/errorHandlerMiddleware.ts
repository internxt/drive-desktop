import { Request, Response, NextFunction } from 'express';
import Logger from 'electron-log';
import * as Sentry from '@sentry/electron/main';

export function errorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  Logger.error(err);
  Sentry.captureException(err);

  res.sendStatus(500);
}
