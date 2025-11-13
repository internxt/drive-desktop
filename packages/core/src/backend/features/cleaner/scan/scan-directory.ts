import { join } from 'node:path/posix';

import { logger } from '@/backend/core/logger/logger';
import { FileSystemModule } from '@/backend/infra/file-system/file-system.module';

import { CleanableItem, CleanerContext } from '../types/cleaner.types';
import { isInternxtRelated } from '../utils/is-file-internxt-related';
import { processDirent } from './process-dirent';

type Props = {
  ctx: CleanerContext;
  dirPath: string;
  customFileFilter?: ({ ctx, fileName }: { ctx: CleanerContext; fileName: string }) => boolean;
  customDirectoryFilter?: ({ folderName }: { folderName: string }) => boolean;
};

export async function scanDirectory({ ctx, dirPath, customFileFilter, customDirectoryFilter }: Props) {
  const { data: dirents, error } = await FileSystemModule.readdir({ absolutePath: dirPath });

  if (error) {
    if (error.code !== 'NON_EXISTS') {
      logger.warn({
        tag: 'CLEANER',
        msg: 'Folder cannot be accessed, skipping',
        dirPath,
        error: error.code === 'UNKNOWN' ? error : error.code,
      });
    }

    return [];
  }

  const items: CleanableItem[] = [];

  for (const dirent of dirents) {
    const fullPath = join(dirPath, dirent.name);
    if (isInternxtRelated({ name: fullPath })) continue;

    const cleanableItems = await processDirent({
      ctx,
      entry: dirent,
      fullPath,
      customFileFilter,
      customDirectoryFilter,
    });

    items.push(...cleanableItems);
  }

  return items;
}
