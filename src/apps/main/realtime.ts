import { io, Socket } from 'socket.io-client';
import { getUser, obtainToken } from './auth/service';
import eventBus from './event-bus';
import { broadcastToWindows } from './windows';
import { logger } from '../shared/logger/logger';
import { debouncedSynchronization } from './remote-sync/handlers';
import { NOTIFICATION_SCHEMA } from './notification-schema';

type XHRRequest = {
  getResponseHeader: (headerName: string) => string[] | null;
};
// REMOTE TRIGGER

let socket: Socket | undefined;

let user = getUser();

export function cleanAndStartRemoteNotifications() {
  stopRemoteNotifications();

  socket = io(process.env.NOTIFICATIONS_URL, {
    transports: ['websocket'],
    auth: {
      token: obtainToken('newToken'),
    },
    withCredentials: true,
  });

  socket.on('open', () => {
    socket?.io.engine.transport.on('pollComplete', () => {
      const xhr = (
        socket?.io.engine.transport as unknown as {
          pollXhr: { xhr: XHRRequest };
        }
      ).pollXhr.xhr;

      const cookieHeader = xhr.getResponseHeader('set-cookie');
      if (!cookieHeader) {
        return;
      }
      cookieHeader.forEach((cookieString: string) => {
        if (cookieString.includes('INGRESSCOOKIE=')) {
          const cookie = cookieString.split(';')[0];
          if (socket) {
            socket.io.opts.extraHeaders = {
              cookie,
            };
          }
        }
      });
    });
  });

  socket.on('connect', () => {
    logger.debug({ msg: 'Remote notifications connected' });
  });

  socket.on('disconnect', (reason) => {
    logger.warn({ msg: 'Remote notifications disconnected', reason });
  });

  socket.on('connect_error', () => {
    logger.warn({ msg: 'Remote notifications connect error' });
  });

  socket.on('event', async (data) => {
    broadcastToWindows('remote-changes', undefined);

    if (data.event === 'FOLDER_DELETED') {
      broadcastToWindows('refresh-backup', undefined);
    }

    if (!user) {
      user = getUser();
    }

    const parsedData = await NOTIFICATION_SCHEMA.safeParseAsync(data);

    if (parsedData.success && parsedData.data.clientId === 'drive-desktop') {
      const { data } = parsedData;
      logger.debug({
        msg: 'Notification received',
        event: data.event,
        clientId: data.clientId,
      });
    } else {
      logger.info({ msg: 'Notification received', data });
      await debouncedSynchronization();
    }
  });
}

function stopRemoteNotifications() {
  if (socket) {
    socket.close();
    socket = undefined;
  }
}

eventBus.on('USER_LOGGED_OUT', stopRemoteNotifications);
eventBus.on('USER_WAS_UNAUTHORIZED', stopRemoteNotifications);
