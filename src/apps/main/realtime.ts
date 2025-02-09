import Logger from 'electron-log';
import { io, Socket } from 'socket.io-client';
import { getUser, obtainToken } from './auth/service';
import eventBus from './event-bus';
import { broadcastToWindows } from './windows';
import { ipcMain } from 'electron';
import { debouncedSynchronization } from './remote-sync/handlers';
import { logger } from '../shared/logger/logger';

type XHRRequest = {
  getResponseHeader: (headerName: string) => string[] | null;
};
// REMOTE TRIGGER

let socket: Socket | undefined;

let user = getUser();

function cleanAndStartRemoteNotifications() {
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
    logger.info({ msg: 'Remote notifications connected' });
  });

  socket.on('disconnect', (reason) => {
    Logger.log('❌ Remote notifications disconnected, reason: ', reason);
  });

  socket.on('connect_error', (error) => {
    Logger.error('❌ Remote notifications connect error: ', error);
  });

  socket.on('event', (data) => {
    broadcastToWindows('remote-changes', undefined);

    if (data.event === 'FOLDER_DELETED') {
      broadcastToWindows('refresh-backup', undefined);
    }

    if (!user) {
      user = getUser();
    }

    if (data.payload.bucket !== user?.backupsBucket) {
      Logger.log('Notification received: ', data);
      setTimeout(() => {
        debouncedSynchronization();
      }, 2000);
      return;
    }

    const { event, payload } = data;

    logger.log('Notification received 2: ', event, payload);
  });
}

function stopRemoteNotifications() {
  if (socket) {
    socket.close();
    socket = undefined;
  }
}

eventBus.on('USER_LOGGED_IN', cleanAndStartRemoteNotifications);
eventBus.on('USER_LOGGED_OUT', stopRemoteNotifications);
eventBus.on('USER_WAS_UNAUTHORIZED', stopRemoteNotifications);
