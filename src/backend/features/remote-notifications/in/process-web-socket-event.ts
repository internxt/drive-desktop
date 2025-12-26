import { NOTIFICATION_SCHEMA } from '@/apps/main/notification-schema';
import { logger } from '@/apps/shared/logger/logger';
import { updateAllRemoteSync } from '@/apps/main/remote-sync/handlers';
import { INTERNXT_CLIENT } from '@/core/utils/utils';

export async function processWebSocketEvent({ data }: { data: unknown }) {
  const parsedEventData = await NOTIFICATION_SCHEMA.safeParseAsync(data);

  if (parsedEventData.success && parsedEventData.data.clientId === INTERNXT_CLIENT) {
    const event = parsedEventData.data;
    logger.debug({
      msg: 'Local notification received',
      event: event.event,
      clientId: event.clientId,
      payload: event.payload,
    });
  } else {
    logger.debug({ msg: 'Remote notification received', data });
    await updateAllRemoteSync();
  }
}
