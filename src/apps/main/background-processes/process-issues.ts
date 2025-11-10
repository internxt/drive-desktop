import { Notification } from 'electron';

import { logger } from '@/apps/shared/logger/logger';
import { iconPath } from '@/apps/utils/icon';

let lastDialogTime = 0;

export function showNotEnoughSpaceNotification() {
  const now = Date.now();
  const TWO_MINUTES = 2 * 60 * 1000;

  if (now - lastDialogTime < TWO_MINUTES) {
    return;
  }
  lastDialogTime = now;

  const notification = new Notification({
    title: 'Internxt',
    body: 'Your account storage limit has been reached, for more details go to Settings -> Issues',
    icon: iconPath,
  });

  notification.on('click', () => {
    logger.debug({ msg: 'The users clicked on the notification' });
  });

  /**
   * v2.5.3 Daniel Jiménez
   * TODO: Notification is not working
   */
  notification.show();
}
