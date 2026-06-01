import { logger } from '@internxt/drive-desktop-core/build/backend';
import type { Device } from './types/Device';
import { DeviceModule } from '../device/device.module';
import { addFolderToTrash } from '../../../infra/drive-server/services/folder/services/add-folder-to-trash';
import { getBackupFolderTreeSnapshot } from './get-backup-folder-tree-snapshot';
import { deleteBackup } from './delete-backup';

type Props = {
  device: Device;
  isCurrent?: boolean;
};

export async function deleteDeviceBackups({ device, isCurrent }: Props) {
  const backups = await DeviceModule.getBackupsFromDevice(device, isCurrent);
  logger.debug({ tag: 'BACKUPS', msg: '[BACKUPS] Deleting backups from device', count: backups.length });
  logger.debug({ tag: 'BACKUPS', msg: '[BACKUPS] Backups details', backups });

  const backupDeletionPromises = backups.map((backup) => deleteBackup({ backup, isCurrent }));
  await Promise.all(backupDeletionPromises);

  const { error, data } = await getBackupFolderTreeSnapshot({ folderUuid: device.uuid });
  if (error) {
    logger.error({ tag: 'BACKUPS', msg: 'Error fetching backup folder tree snapshot', error });
    return;
  }

  const { tree } = data;
  const foldersToDelete = tree.children.filter((folder) => !backups.some((backup) => backup.folderId === folder.id));
  const folderDeletionPromises = foldersToDelete.map(async (folder) => {
    await addFolderToTrash(folder.uuid);
  });
  await Promise.all(folderDeletionPromises);
}
