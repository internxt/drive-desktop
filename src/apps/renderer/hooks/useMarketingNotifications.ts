import { useEffect } from 'react';
import appIcon from '../../../../assets/icons/256x256.png';
import type { UserNotification } from '../../../infra/drive-server/out/dto';

export function useMarketingNotifications() {
  useEffect(() => {
    const removeListener = window.electron.onMarketingNotifications((notifications) => {
      for (const notification of notifications) {
        showMarketingNotification(notification);
      }
    });

    return () => {
      removeListener();
    };
  }, []);
}

function showMarketingNotification(notification: UserNotification) {
  const popup = new Notification('Internxt Drive', {
    body: notification.message,
    icon: appIcon,
  });

  popup.onclick = () => {
    void openNotificationLink(notification.link);
  };
}

async function openNotificationLink(link: string): Promise<void> {
  try {
    const url = new URL(link);

    if (url.protocol !== 'https:') {
      throw new Error('Unsupported marketing notification link protocol: ' + url.protocol);
    }

    await window.electron.openUrl(url.toString());
  } catch (error) {
    window.electron.logger.error({ msg: '[RENDERER] Error opening marketing notification link', link, error });
  }
}
