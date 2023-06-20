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
    transports: ['websocket', 'polling'],
    auth: {
      token: obtainToken('bearerToken'),
    },
    withCredentials: true,
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
