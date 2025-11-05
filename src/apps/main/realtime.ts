import { io, Socket } from 'socket.io-client';
import { obtainToken } from './auth/service';
import { logger } from '../shared/logger/logger';
import { addGeneralIssue, removeGeneralIssue } from '@/apps/main/background-processes/issues';
import { RemoteNotificationsModule } from '@/backend/features/remote-notifications/remote-notifications.module';

type XHRRequest = {
  getResponseHeader: (headerName: string) => string[] | null;
};
// REMOTE TRIGGER

let socket: Socket | undefined;

export function cleanAndStartRemoteNotifications() {
  stopRemoteNotifications();

  socket = io(process.env.NOTIFICATIONS_URL, {
    transports: ['websocket'],
    auth: {
      token: obtainToken(),
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
    removeGeneralIssue({
      error: 'WEBSOCKET_CONNECTION_ERROR',
      name: 'Remote notifications',
    });
  });

  socket.on('disconnect', (reason) => {
    logger.warn({ msg: 'Remote notifications disconnected', reason });
  });

  socket.on('connect_error', () => {
    logger.warn({ msg: 'Remote notifications connect error' });
    addGeneralIssue({
      error: 'WEBSOCKET_CONNECTION_ERROR',
      name: 'Remote notifications',
    });
  });

  socket.on('event', (data) => {
    void RemoteNotificationsModule.processWebSocketEvent({ data });
  });
}

export function stopRemoteNotifications() {
  if (socket) {
    socket.close();
    socket = undefined;
  }
}
