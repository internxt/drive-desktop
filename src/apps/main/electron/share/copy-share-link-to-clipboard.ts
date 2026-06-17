import { clipboard } from 'electron';
import { logger } from '@/apps/shared/logger/logger';

export function copyShareLinkToClipboard(link: string) {
  try {
    clipboard.writeText(link);
    logger.debug({ msg: 'Public share link copied to clipboard' });
    return true;
  } catch (error) {
    logger.error({ msg: 'Error copying share link to clipboard', error });
    return false;
  }
}
