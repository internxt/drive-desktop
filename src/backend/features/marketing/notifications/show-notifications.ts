import { iconPath } from '@/apps/utils/icon';
import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { MarketingNotification } from '@/infra/drive-server-wip/services/notifications/get-notifications';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Notification, shell } from 'electron';

function showNotification(notification: MarketingNotification) {
  logger.debug({ msg: 'Show notification', message: notification.message });

  const popup = new Notification({
    title: 'Internxt',
    icon: iconPath,
    body: notification.message,
    urgency: 'normal',
  });

  popup.show();

  popup.on('click', () => {
    void shell.openExternal(notification.link);
    logger.debug({ msg: 'Notification clicked', message: notification.message, link: notification.link });
  });

  popup.on('close', () => {
    logger.debug({ msg: 'Notification closed', message: notification.message });
  });

  popup.on('failed', (error) => {
    logger.error({ msg: 'Notification failed', message: notification.message, error });
  });
}

export async function showNotifications() {
  const { data: notifications } = await DriveServerWipModule.NotificationModule.getAll();

  if (notifications) {
    for (const notification of notifications) {
      showNotification(notification);
    }
  }
}
