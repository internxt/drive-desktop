import { AbsolutePath } from '../../localFile/infrastructure/AbsolutePath';

export type LocalFolderDTO = {
  path: AbsolutePath;
  modificationTime: number;
};
