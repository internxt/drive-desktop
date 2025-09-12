import { CleanableItem } from './cleaner.types';
import { promises as fs } from 'fs';
import { wasAccessedWithinLastHour } from './utils/was-accessed-within-last-hour';
import { createCleanableItem } from './utils/create-cleanable-item';
import { logger } from '@internxt/drive-desktop-core/build/backend';

/**
 * Scan a single file and return it as a CleanableItem if it's safe to delete
 * @param filePath Path to the single file to check
 * @returns Promise<CleanableItem[]> Array with single item if file is safe to delete, empty array otherwise
 */
export async function scanSingleFile(
  filePath: string
): Promise<CleanableItem[]> {
  try {
    const stat = await fs.stat(filePath);

    if (!stat.isFile() || (await wasAccessedWithinLastHour(filePath))) {
      return [];
    }

    const item = await createCleanableItem(filePath);
    return [item];
  } catch (error) {
    logger.warn({
      msg: `Single file with file path ${filePath} cannot be accessed, skipping`,
    });
    return [];
  }
}
