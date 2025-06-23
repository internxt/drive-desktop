import { broadcastToWindows } from '@/apps/main/windows';
import { FOLDER_DELETED, NOTIFICATION_SCHEMA } from '@/apps/main/notification-schema';
import { logger } from '@/apps/shared/logger/logger';
import { debouncedSynchronization } from '@/apps/main/remote-sync/handlers';
import { handleParsedNotificationEvent } from './handle-parsed-notification-event';

async function logAndSync({ data }: { data: unknown }) {
  logger.info({ msg: 'Notification received', data });
  await debouncedSynchronization();
}

export async function processWebSocketEvent({ data }: { data: unknown }) {
  if (FOLDER_DELETED.safeParse(data).success) {
    broadcastToWindows('refresh-backup', undefined);
    await logAndSync({ data });
  }

  const parsedEventData = await NOTIFICATION_SCHEMA.safeParseAsync(data);
  if (parsedEventData.success) {
    await handleParsedNotificationEvent({ event: parsedEventData.data });
  } else {
    await logAndSync({ data });
  }
}
