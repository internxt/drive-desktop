import { Notification } from 'electron';
import { logger } from '@/apps/shared/logger/logger';
import { iconPath } from '@/apps/utils/icon';

const NOTIFICATION_TITLE = 'Internxt';
const SUCCESS_MESSAGE = 'Link copied to clipboard';
const ERROR_MESSAGE = 'Error sharing item, try again later.';
export function showShareResultNotification(result: 'success' | 'error') {
  const body = result === 'success' ? SUCCESS_MESSAGE : ERROR_MESSAGE;
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
