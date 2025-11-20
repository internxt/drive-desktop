import { AbsolutePath } from '../infrastructure/AbsolutePath';

export type LocalFile = {
  absolutePath: AbsolutePath;
  modificationTime: Date;
  size: number;
};
