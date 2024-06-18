import { AbsolutePath } from '../../localFile/infrastructure/AbsolutePath';

export type LocalFileDTO = {
  path: AbsolutePath;
  modificationTime: number;
  size: number;
};
