import { clipboard, Notification } from 'electron';
import { logger } from '@/apps/shared/logger/logger';
import { iconPath } from '@/apps/utils/icon';

const NOTIFICATION_TITLE = 'Internxt';
const SUCCESS_MESSAGE = 'Link copied to clipboard';
const ERROR_MESSAGE = 'Error sharing item, try again later.';

export function copyTextToClipboard(text: string) {
  clipboard.writeText(text);
}

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

export function copyShareLinkToClipboard(link: string) {
  try {
    copyTextToClipboard(link);
    showShareResultNotification('success');
    return true;
  } catch (error) {
    logger.error({ msg: 'Error copying share link to clipboard', error });
    showShareResultNotification('error');
    return false;
  }
}
