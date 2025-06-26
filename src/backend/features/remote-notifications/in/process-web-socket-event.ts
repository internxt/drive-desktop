import { broadcastToWindows } from '@/apps/main/windows';
import { FOLDER_DELETED, NOTIFICATION_SCHEMA } from '@/apps/main/notification-schema';
import { logger } from '@/apps/shared/logger/logger';
import { debouncedSynchronization } from '@/apps/main/remote-sync/handlers';

export async function processWebSocketEvent({ data }: { data: unknown }) {
  const parsedEventData = await NOTIFICATION_SCHEMA.safeParseAsync(data);

  if (parsedEventData.success && parsedEventData.data.clientId === 'drive-desktop') {
    const event = parsedEventData.data;
    logger.debug({
      msg: 'Notification received',
      event: event.event,
      clientId: event.clientId,
      payload: event.payload,
    });
  } else {
    if (FOLDER_DELETED.safeParse(data).success) {
      broadcastToWindows('refresh-backup', undefined);
    }

    logger.info({ msg: 'Notification received', data });
    await debouncedSynchronization();
  }
}
