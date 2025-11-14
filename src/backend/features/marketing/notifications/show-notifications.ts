import { iconPath } from '@/apps/utils/icon';
import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { MarketingNotification } from '@/infra/drive-server-wip/services/notifications/get-notifications';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Notification } from 'electron';

function showNotification(notification: MarketingNotification) {
  logger.debug({ msg: 'Show notification', message: notification.message });

  const toastXml = `
<toast launch="com.internxt.drive:action=navigate&amp;contentId=${notification.link}" activationType="protocol">
  <visual>
    <binding template="ToastGeneric">
      <text>${notification.message}</text>
      <image placement="appLogoOverride" src="${iconPath}"/>
    </binding>
  </visual>
</toast>`;

  const popup = new Notification({ toastXml });

  popup.on('failed', (error) => {
    logger.error({ msg: 'Notification failed', message: notification.message, error });
  });

  popup.show();
}

export async function showNotifications() {
  const { data: notifications = [] } = await DriveServerWipModule.NotificationModule.getAll();

  logger.debug({ msg: 'Show marketing notifications', notifications: notifications.length });

  for (const notification of notifications) {
    showNotification(notification);
  }
}
