import { Dirent } from 'node:fs';
import { stat } from 'node:fs/promises';

import { logger } from '@/backend/core/logger/logger';

import { CleanerContext } from '../types/cleaner.types';
import { createCleanableItem } from '../utils/create-cleanable-item';
import { wasAccessedWithinLastHour } from '../utils/was-accessed-within-last-hour';
import { scanDirectory } from './scan-directory';

type Props = {
  ctx: CleanerContext;
  entry: Dirent;
  fullPath: string;
  customDirectoryFilter?: ({ folderName }: { folderName: string }) => boolean;
  customFileFilter?: ({ ctx, fileName }: { ctx: CleanerContext; fileName: string }) => boolean;
};

export async function processDirent({ ctx, entry, fullPath, customFileFilter, customDirectoryFilter }: Props) {
  try {
    if (entry.isFile()) {
      const isIncluded = customFileFilter?.({ ctx, fileName: entry.name }) ?? true;
      if (!isIncluded) return [];

      const fileStats = await stat(fullPath);
      const wasAccessed = wasAccessedWithinLastHour({ fileStats });
      if (wasAccessed) return [];

      const item = createCleanableItem({ filePath: fullPath, stat: fileStats });
      return [item];
    }

    if (entry.isDirectory()) {
      const isExcluded = customDirectoryFilter?.({ folderName: entry.name });
      if (isExcluded) return [];

      return await scanDirectory({
        ctx,
        dirPath: fullPath,
        customFileFilter,
        customDirectoryFilter,
      });
    }
  } catch {
    logger.warn({
      tag: 'CLEANER',
      msg: 'File or folder cannot be accessed, skipping',
      fullPath,
    });
  }

  return [];
}
