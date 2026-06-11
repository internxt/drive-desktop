import { logger } from '@internxt/drive-desktop-core/build/backend';
import { broadcastToWindows } from '../../../../apps/main/windows';
import { foldResult } from '../../../../context/shared/domain/Result';
import { getNotifications } from '../../../../infra/drive-server/services/notifications/get-notifications';
import type { UserNotification } from '../../../../infra/drive-server/out/dto';

const MARKETING_NOTIFICATIONS_EVENT = 'marketing-notifications';

export async function showMarketingNotifications() {
  const result = await getNotifications();

  foldResult(result, {
    data: showNotifications,
    error: (error) => logger.error({ msg: 'Error showing marketing notifications', error }),
  });
}

function showNotifications(notifications: Array<UserNotification>) {
  if (notifications.length === 0) {
    return;
  }

  logger.debug({ msg: 'Forward marketing notifications to renderer', count: notifications.length });
  broadcastToWindows(MARKETING_NOTIFICATIONS_EVENT, notifications);
}
