import { throwWrapper } from '@/backend/core/utils/throw-wrapper';

import { readdir } from './services/readdir';
import { stat } from './services/stat';

export type { AbsolutePath, RelativePath } from './file-system.types';
export const FileSystemModule = {
  stat,
  statThrow: throwWrapper(stat),
  readdir,
  readdirThrow: throwWrapper(readdir),
};
