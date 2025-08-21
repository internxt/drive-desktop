import { AbsolutePath, RelativePath } from '../infrastructure/AbsolutePath';
import { LocalFileSize } from './LocalFileSize';

export type LocalFile = {
  absolutePath: AbsolutePath;
  relativePath: RelativePath;
  modificationTime: Date;
  size: LocalFileSize;
};
