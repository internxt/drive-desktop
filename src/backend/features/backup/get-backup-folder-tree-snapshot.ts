import { aes } from '@internxt/lib';
import { fetchFolderTreeByUuid } from '../../../infra/drive-server/services/folder/services/fetch-folder-tree-by-uuid';
import { buildBackupFolderTreeSnapshot } from './build-backup-folder-tree-snapshot';
import { BackupFolderTreeSnapshot } from './types/BackupFolderTreeSnapshot';
import { Result } from '../../../context/shared/domain/Result';

type Props = {
  folderUuid: string;
};

export async function getBackupFolderTreeSnapshot({
  folderUuid,
}: Props): Promise<Result<BackupFolderTreeSnapshot, Error>> {
  const { data, error } = await fetchFolderTreeByUuid({ uuid: folderUuid });

  if (error) {
    return { error: new Error('Unsuccesful request to fetch folder tree') };
  }

  const { tree } = data;
  const backupFolderTreeSnapshot = buildBackupFolderTreeSnapshot({
    tree,
    decryptFileName: (name, folderId) => aes.decrypt(name, `${process.env.NEW_CRYPTO_KEY}-${folderId}`),
  });

  return { data: backupFolderTreeSnapshot };
}
