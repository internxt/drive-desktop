import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

export type OfflineFileAttributes = {
  contentsId: string;
  path: AbsolutePath;
  size: number;
  folderUuid: string;
};
