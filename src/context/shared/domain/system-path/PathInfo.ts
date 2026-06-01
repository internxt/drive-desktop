import { AbsolutePath } from '../../../local/localFile/infrastructure/AbsolutePath';

export type PathInfo = {
  path: AbsolutePath;
  itemName: string;
  isDirectory?: boolean;
};
