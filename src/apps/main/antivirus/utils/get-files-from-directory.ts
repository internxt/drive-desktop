import { readdir } from 'fs/promises';
import { resolve } from 'path';
import { PathTypeChecker } from '@/apps/shared/fs/PathTypeChecker ';
import { logger } from '@/apps/shared/logger/logger';

type TProps = {
  filePaths: string[];
  folder: string;
};

async function _getFilesFromDirectory({ filePaths, folder }: TProps) {
  try {
    const items = await readdir(folder, { withFileTypes: true });

    const promises = items.map(async (item) => {
      const name = item.name.toLowerCase();

      if (name.includes('temp')) return;
      if (name.includes('tmp')) return;

      const fullPath = resolve(folder, item.name);

      if (item.isFile()) {
        filePaths.push(fullPath);
      } else if (item.isDirectory()) {
        await _getFilesFromDirectory({
          filePaths,
          folder: fullPath,
        });
      }
    });

    await Promise.all(promises);
  } catch (exc) {
    logger.error({
      tag: 'ANTIVIRUS',
      msg: 'Error getting files from directory',
      exc,
    });
  }
}

export async function getFilesFromDirectory({ filePaths, folder }: TProps) {
  const isFolder = await PathTypeChecker.isFolder(folder);
  if (!isFolder) return;
  await _getFilesFromDirectory({ filePaths, folder });
}
