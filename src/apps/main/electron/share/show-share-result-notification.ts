import { Notification } from 'electron';
import { getLanguage } from '@/apps/main/config/language';
import { logger } from '@/apps/shared/logger/logger';
import { iconPath } from '@/apps/utils/icon';
import { messages, NOTIFICATION_TITLE } from './constants';

export function showShareResultNotification(result: 'success' | 'error') {
  const body = messages[getLanguage()][result];
  const notification = new Notification({
    title: NOTIFICATION_TITLE,
    body,
    icon: iconPath,
  });

  notification.on('failed', (error) => {
    logger.error({ msg: 'Share result notification failed', body, error });
  });

  notification.show();
}
