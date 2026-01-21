import { promises as fs } from 'node:fs';

import { logger } from '@/backend/core/logger/logger';

import { createCleanableItem } from '../utils/create-cleanable-item';
import { wasAccessedWithinLastHour } from '../utils/was-accessed-within-last-hour';

export async function scanSingleFile({ filePath }: { filePath: string }) {
  try {
    const fileStats = await fs.stat(filePath);

    if (!fileStats.isFile() || wasAccessedWithinLastHour({ fileStats })) {
      return [];
    }

    const item = createCleanableItem({ filePath, stat: fileStats });
    return [item];
  } catch {
    logger.warn({
      tag: 'CLEANER',
      msg: `Single file cannot be accessed, skipping`,
      filePath,
    });
  }

  return [];
}
