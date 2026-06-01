import { io, Socket } from 'socket.io-client';
import { getUser } from './auth/service';
import { getCredentials } from './auth/get-credentials';
import eventBus from './event-bus';
import { broadcastToWindows } from './windows';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { getUserAvailableProductsAndStore } from '../../backend/features/payments/services/get-user-available-products-and-store';

type XHRRequest = {
  getResponseHeader: (headerName: string) => string[] | null;
};
// REMOTE TRIGGER

let socket: Socket | undefined;

export type EventPayload = {
  eventName?: string;
  id?: number;
  uuid?: string;
  bucket?: string;
};

let user = getUser();

function stopRemoteNotifications() {
  if (socket) {
    socket.close();
    socket = undefined;
  }
}

function cleanAndStartRemoteNotifications() {
  stopRemoteNotifications();
  const { newToken } = getCredentials();

  socket = io(process.env.NOTIFICATIONS_URL, {
    transports: ['websocket'],
    auth: {
      token: newToken,
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
    logger.debug({ msg: '✅ Remote notifications connected' });
  });

  socket.on('disconnect', (reason) => {
    logger.debug({
      msg: '❌ Remote notifications disconnected, reason: ',
      reason,
    });
  });

  socket.on('connect_error', () => {
    logger.error({ msg: '❌ Remote notifications connect error' });
  });

  socket.on('event', (data) => {
    const eventPayload: EventPayload = {};

    if (data.event) {
      eventPayload.eventName = data.event;
    }

    if (data.payload.id) {
      eventPayload.id = data.payload.id;
    }

    if (data.payload.uuid) {
      eventPayload.uuid = data.payload.uuid;
    }

    if (data.payload.bucket) {
      eventPayload.bucket = data.payload.bucket;
    }

    if (eventPayload.eventName === 'PLAN_UPDATED') {
      void getUserAvailableProductsAndStore();
    }

    broadcastToWindows('remote-changes', eventPayload);

    if (!user) {
      user = getUser();
    }

    if (data.payload.bucket !== user?.backupsBucket) {
      // create an object with properties if present in the payload

      logger.debug({
        msg: 'Notification received: ',
        eventPayload,
      });
      eventBus.emit('RECEIVED_REMOTE_CHANGES');
      return;
    }

    const { event, payload } = data;

    logger.debug({
      msg: 'Notification received: ',
      event,
      payloadPlainName: payload.plain_name,
    });
  });
}

eventBus.on('USER_LOGGED_IN', cleanAndStartRemoteNotifications);
eventBus.on('USER_LOGGED_OUT', stopRemoteNotifications);
