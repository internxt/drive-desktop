import { logger } from '@internxt/drive-desktop-core/build/backend';
import { basename } from 'node:path';
import configStore from '../../../apps/main/config';
import { getBackupFolderUuid } from '../../../infra/drive-server/services/folder/services/fetch-backup-folder-uuid';
import { renameFolder } from '../../../infra/drive-server/services/folder/services/rename-folder';
import { migrateBackupEntryIfNeeded } from './migrate-backup-entry-if-needed';
import { AbsolutePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import { Result } from '../../../context/shared/domain/Result';

type Props = {
  currentPath: AbsolutePath;
  newPath: AbsolutePath;
};

export async function changeBackupPath({ currentPath, newPath }: Props): Promise<Result<boolean, Error>> {
  const backupsList = configStore.get('backupList');
  const existingBackup = backupsList[currentPath];

  if (!existingBackup) {
    return { error: new Error('No backup found with the provided path') };
  }

  if (backupsList[newPath]) {
    return { error: new Error('A backup with this path already exists') };
  }

  const oldFolderName = basename(currentPath);
  const newFolderName = basename(newPath);
  if (oldFolderName !== newFolderName) {
    logger.debug({ tag: 'BACKUPS', msg: 'Renaming backup', existingBackup });

    const getFolderUuidResponse = await getBackupFolderUuid({ folderId: String(existingBackup.folderId) });
    if (getFolderUuidResponse.error) {
      return { error: getFolderUuidResponse.error };
    }
    const { data: folderUuid } = getFolderUuidResponse;

    const res = await renameFolder({ uuid: folderUuid, plainName: newFolderName });
    if (res.error) {
      return { error: new Error('Error in the request to rename a backup') };
    }

    delete backupsList[currentPath];

    const migratedExistingBackup = await migrateBackupEntryIfNeeded({
      pathname: newPath,
      backup: existingBackup,
    });
    backupsList[newPath] = migratedExistingBackup;

    configStore.set('backupList', backupsList);

    return { data: true };
  }

  return { data: false };
}
