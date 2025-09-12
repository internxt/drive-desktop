import { CleanableItem } from './cleaner.types';
import { promises as fs } from 'fs';
import path from 'path';
import { isInternxtRelated } from './utils/is-file-internxt-related';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { processDirent } from './process-dirent';

type ScanDirectoryProps = {
  dirPath: string;
  customFileFilter?: (fileName: string) => boolean;
  customDirectoryFilter?: (folderName: string) => boolean;
};

/**
 * scan a directory and process the result dirents (directory or file entries)
 * @param dirPath Directory path to scan
 *  @param customFileFilter Optional custom filter function to apply to files.
 *  Return true to skip the directory, false to include it.
 *  @param customDirectoryFilter Optional custom filter function to apply to directories.
 *  Return true to skip the directory, false to include it.
 */
export async function scanDirectory({
  dirPath,
  customFileFilter,
  customDirectoryFilter,
}: ScanDirectoryProps): Promise<CleanableItem[]> {
  try {
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      return [];
    }

    const dirents = await fs.readdir(dirPath, { withFileTypes: true });
    const items: CleanableItem[] = [];

    for (const dirent of dirents) {
      const fullPath = path.join(dirPath, dirent.name);
      if (!isInternxtRelated(fullPath)) {
        const cleanableItems = await processDirent({
          entry: dirent,
          fullPath,
          customFileFilter,
          customDirectoryFilter,
        });
        items.push(...cleanableItems);
      }
    }

    return items;
  } catch (error) {
    logger.warn({
      msg: `Directory ${dirPath} does not exist or cannot be accessed, skipping`,
    });
    return [];
  }
}
