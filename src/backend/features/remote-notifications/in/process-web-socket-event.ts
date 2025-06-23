import { broadcastToWindows } from '@/apps/main/windows';
import { FOLDER_DELETED, NOTIFICATION_SCHEMA } from '@/apps/main/notification-schema';
import { handleParsedNotificationEvent, logAndSync } from './handle-parsed-notification-event';

export async function processWebSocketEvent({ data }: { data: unknown }) {
  const parsedEventData = await NOTIFICATION_SCHEMA.safeParseAsync(data);
  if (parsedEventData.success) {
    await handleParsedNotificationEvent({ event: parsedEventData.data });
  } else {
    if (FOLDER_DELETED.safeParse(data).success) {
      broadcastToWindows('refresh-backup', undefined);
    }
    await logAndSync({ data });
  }
}
