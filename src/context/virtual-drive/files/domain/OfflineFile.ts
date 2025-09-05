import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

export type OfflineFileAttributes = {
  contentsId: string;
  path: RelativePath;
  size: number;
  folderUuid: string;
};
