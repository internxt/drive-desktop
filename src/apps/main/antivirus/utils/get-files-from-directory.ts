import { readdir } from 'fs/promises';
import { join } from 'path';
import { PathTypeChecker } from '@/apps/shared/fs/PathTypeChecker';
import { logger } from '@/apps/shared/logger/logger';

type TProps = {
  rootFolder: string;
};

export async function getFilesFromDirectory({ rootFolder }: TProps) {
  logger.debug({
    tag: 'ANTIVIRUS',
    msg: 'Getting files from directory',
    rootFolder,
  });

  const isFolder = await PathTypeChecker.isFolder(rootFolder);
  if (!isFolder) return [];

  const folders: string[] = [rootFolder];
  const files: string[] = [];

  while (folders.length > 0) {
    const folder = folders.shift();
    if (!folder) continue;

    try {
      const items = await readdir(folder, { withFileTypes: true });

      for (const item of items) {
        const name = item.name.toLowerCase();

        if (name.includes('temp') || name.includes('tmp')) continue;

        const fullPath = join(folder, item.name);

        if (item.isFile()) {
          files.push(fullPath);
        } else if (item.isDirectory()) {
          folders.push(fullPath);
        }
      }
    } catch (exc) {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: 'Error getting files from directory',
        exc,
      });
    }
  }

  return files;
}
