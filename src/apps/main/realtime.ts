import logger from 'electron-log';
import { io, Socket } from 'socket.io-client';
import { obtainToken } from './auth/service';
import eventBus from './event-bus';
import { broadcastToWindows } from './windows';

type XHRRequest = {
  getResponseHeader: (headerName: string) => string[] | null;
};
// REMOTE TRIGGER

let socket: Socket | undefined;

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
    logger.log('✅ Remote notifications connected');
  });

  socket.on('disconnect', (reason) => {
    logger.log('❌ Remote notifications disconnected, reason: ', reason);
  });

  socket.on('connect_error', (error) => {
    logger.error('❌ Remote notifications connect error: ', error);
  });

  socket.on('event', (data) => {
    logger.log('Notification received: ', data);

    broadcastToWindows('remote-changes', undefined);
    eventBus.emit('RECEIVED_REMOTE_CHANGES');
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
