import { FolderTree } from '@internxt/sdk/dist/drive/storage/types';

export type BackupFolderTreeSnapshot = {
  tree: FolderTree;
  folderDecryptedNames: Record<number, string>;
  fileDecryptedNames: Record<number, string>;
  size: number;
};
