import { Dirent } from 'fs';
import { CleanableItem } from './cleaner.types';
import { wasAccessedWithinLastHour } from './utils/was-accessed-within-last-hour';
import { createCleanableItem } from './utils/create-cleanable-item';
import { scanDirectory } from './scan-directory';
import { logger } from '@internxt/drive-desktop-core/build/backend';
type ProcessDirentProps = {
  entry: Dirent;
  fullPath: string;
  customDirectoryFilter?: (directoryName: string) => boolean;
  customFileFilter?: (fileName: string) => boolean;
};
/**
 * Process a single directory entry (file or subdirectory)
 */
export async function processDirent({
  entry,
  fullPath,
  customFileFilter,
  customDirectoryFilter,
}: ProcessDirentProps): Promise<CleanableItem[]> {
  try {
    if (entry.isFile()) {
      if (
        (await wasAccessedWithinLastHour(fullPath)) ||
        (customFileFilter && customFileFilter(entry.name))
      ) {
        return [];
      }

      const item = await createCleanableItem(fullPath);
      return [item];
    } else if (entry.isDirectory()) {
      if (customDirectoryFilter && customDirectoryFilter(entry.name)) {
        return [];
      }

      return await scanDirectory({
        dirPath: fullPath,
        customFileFilter,
        customDirectoryFilter,
      });
    }
  } catch (error) {
    logger.warn({
      msg: `File or Directory with path ${fullPath} cannot be accessed, skipping`,
    });
  }

  return [];
}
