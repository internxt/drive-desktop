import checkDiskSpace from 'check-disk-space';

import { logger } from '@/backend/core/logger/logger';

export async function getDiskSpace({ mainPath }: { mainPath: string }) {
  try {
    const { size } = await checkDiskSpace(mainPath);
    return size;
  } catch (error) {
    logger.error({ msg: 'Failed to get disk space', error });
    return 0;
  }
}
