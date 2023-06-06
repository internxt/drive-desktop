import { RequestContext } from 'webdav-server/lib/index.v2';
import * as Sentry from '@sentry/electron/renderer';
import Logger from 'electron-log';
import { ipc } from '../ipc';

function handleError(error: Error, context?: Record<string, string>): void {
  Logger.error('[FS] Error coping file ', error);
  ipc.send('WEBDAV_ACTION_ERROR', error);
  Sentry.captureException(error, context);
}

export function handleFileSystemError(
  error: Error,
  action: string,
  { context: requestContext }: { context: RequestContext }
) {
  requestContext.rootPath;
  const context = {
    action,
    from: requestContext.requested.uri,
    root: requestContext.rootPath,
  };

  handleError(error, context);
}
