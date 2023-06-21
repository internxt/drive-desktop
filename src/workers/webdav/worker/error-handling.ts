import { RequestContext } from 'webdav-server/lib/index.v2';
// import * as Sentry from '@sentry/electron/renderer';
import Logger from 'electron-log';
import { ipc } from '../ipc';
import {
  TrackedWebdavServerEvents,
  WebdavErrorContext,
} from '../../../shared/IPC/events/webdav';

function handleError(error: Error, context: WebdavErrorContext): void {
  Logger.error('[FS] Error: ', error);
  ipc.send('WEBDAV_ACTION_ERROR', error, context);
  // Sentry.captureException(error, context);
}

export function handleFileSystemError(
  error: Error,
  action: TrackedWebdavServerEvents,
  type: 'File' | 'Folder',
  { context: requestContext }: { context: RequestContext }
) {
  const context = {
    action,
    itemType: type,
    from: requestContext.requested.uri,
    root: requestContext.rootPath,
  };

  handleError(error, context);
}
