import { Stats } from 'node:fs';
import { basename } from 'node:path/posix';

import { CleanableItem } from '../types/cleaner.types';

export function createCleanableItem({ filePath, stat }: { filePath: string; stat: Stats }) {
  return {
    fullPath: filePath,
    fileName: basename(filePath),
    sizeInBytes: stat.size,
  } as CleanableItem;
}
