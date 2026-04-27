import { logger } from '@internxt/drive-desktop-core/build/backend';
import { existsSync } from 'node:fs';
import { installRelease } from './show-dialog';
import { verifyHash } from './verify-hash';

export async function checkAndInstall({ filePath }: { filePath: string }) {
  if (!existsSync(filePath)) return;

  try {
    logger.debug({ msg: 'Release already downloaded' });
    await verifyHash({ filePath });
    return installRelease({ filePath });
  } catch (error) {
    logger.debug({ msg: 'Invalid downloaded release', error });
  }
}
