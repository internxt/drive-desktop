import { RequestContext } from '@internxt/webdav-server';
import * as Sentry from '@sentry/electron/renderer';
import { ipc } from '../ipc';
import {
  TrackedWebdavServerEvents,
  WebdavErrorContext,
} from '../../../shared/IPC/events/webdav';

function handleError(error: Error, context: WebdavErrorContext): void {
  ipc.send('WEBDAV_ACTION_ERROR', error, context);
  Sentry.captureException(error);
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
