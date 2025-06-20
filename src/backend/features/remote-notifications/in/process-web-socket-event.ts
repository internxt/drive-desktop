import { broadcastToWindows } from '@/apps/main/windows';
import { FOLDER_DELETED, NOTIFICATION_SCHEMA } from '@/apps/main/notification-schema';
import { logger } from '@/apps/shared/logger/logger';
import { debouncedSynchronization } from '@/apps/main/remote-sync/handlers';
import { handleParsedNotificationEvent } from './handle-parsed-notification-event';

export const processWebSocketEvent = async (data: unknown) => {
  if (FOLDER_DELETED.safeParse(data).success) {
    broadcastToWindows('refresh-backup', undefined);
  }
  const parsedEventData = await NOTIFICATION_SCHEMA.safeParseAsync(data);
  if (parsedEventData.success) {
    const { data } = await handleParsedNotificationEvent({ event: parsedEventData.data });
    if (data === false) return;
  }
  logger.info({ msg: 'Notification received', data });
  await debouncedSynchronization();
};