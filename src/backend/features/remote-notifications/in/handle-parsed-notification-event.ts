import { NotificationSchema } from '@/apps/main/notification-schema';
import { logger } from '@/apps/shared/logger/logger';
import { markItemsAsTrashed } from '@/backend/features/remote-notifications/in/mark-items-as-trashed';

export const handleParsedNotificationEvent = async ({ event }: { event: NotificationSchema }) => {
  if (event.clientId === 'drive-desktop') {
    logger.debug({
      msg: 'Notification received',
      event: event.event,
      clientId: event.clientId,
      payload: event.payload,
    });
  } else if (event.event === 'ITEMS_TO_TRASH') {
    await markItemsAsTrashed({ items: event.payload });
  }
};
