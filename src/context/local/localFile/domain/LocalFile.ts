import { AbsolutePath, RelativePath } from '../infrastructure/AbsolutePath';

export type LocalFile = {
  absolutePath: AbsolutePath;
  relativePath: RelativePath;
  modificationTime: Date;
  size: number;
};
