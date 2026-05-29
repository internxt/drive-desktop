import { NOTIFICATION_SCHEMA } from '@/apps/main/notification-schema';
import { updateAllRemoteSync } from '@/apps/main/remote-sync/handlers';
import { logger } from '@/apps/shared/logger/logger';
import { type AuthContext } from '@/apps/sync-engine/config';
import { resolveUserFileSizeLimit } from '@/backend/features/user/file-size-limit';
import { INTERNXT_CLIENT } from '@/core/utils/utils';

export async function processWebSocketEvent({ ctx, data }: { ctx: AuthContext; data: unknown }) {
  const parsedEventData = await NOTIFICATION_SCHEMA.safeParseAsync(data);

  if (parsedEventData.success) {
    const event = parsedEventData.data;

    if (event.clientId === INTERNXT_CLIENT) {
      logger.debug({
        msg: 'Local notification received',
        event: event.event,
        clientId: event.clientId,
        payload: event.payload,
      });
      return;
    }
    if (event.event === 'PLAN_UPDATED') {
      await resolveUserFileSizeLimit({ ctx });
    }
  }

  logger.debug({ msg: 'Remote notification received', data });
  await updateAllRemoteSync();
}
