import logger from 'electron-log';
import { io, Socket } from 'socket.io-client';
import { obtainToken } from './auth/service';
import eventBus from './event-bus';
import { broadcastToWindows } from './windows';

// REMOTE TRIGGER

let socket: Socket | undefined;

function cleanAndStartRemoteNotifications() {
  stopRemoteNotifications();

  socket = io(process.env.NOTIFICATIONS_URL, {
    auth: {
      token: obtainToken('bearerToken'),
    },
    withCredentials: true,
  });

  socket.io.on('open', () => {
    socket?.io.engine.transport.on('pollComplete', () => {
      const request = socket?.io.engine.transport.pollXhr.xhr;
      const cookieHeader = request.getResponseHeader('set-cookie');
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
    logger.log('Remote notifications connected');
  });

  socket.on('disconnect', (reason) => {
    logger.log('Remote notifications disconnected, reason: ', reason);
  });

  socket.on('connect_error', (error) => {
    logger.error('Remote notifications connect error: ', error);
  });

  socket.on('event', (data) => {
    logger.log('Notification received: ', JSON.stringify(data, null, 2));

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
