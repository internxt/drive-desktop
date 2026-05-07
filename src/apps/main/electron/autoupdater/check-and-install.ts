import { logger } from '@internxt/drive-desktop-core/build/backend';
import { access } from '@/infra/file-system/services/access';
import { installRelease } from './show-dialog';
import { verifyHash } from './verify-hash';

export async function checkAndInstall({ filePath }: { filePath: string }) {
  const error = await access(filePath);
  if (error) return;

  try {
    logger.debug({ msg: 'Release already downloaded' });
    await verifyHash({ filePath });
    return installRelease({ filePath });
  } catch (error) {
    logger.debug({ msg: 'Invalid downloaded release', error });
  }
}
