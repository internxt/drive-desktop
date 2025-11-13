import { Device } from '../device/service';
import { Backup } from './types';
import { createBackupFolder } from '../../../infra/drive-server/services/backup/services/create-backup-folder';
import { logger } from '@internxt/drive-desktop-core/build/backend';

type Props = {
  folderName: string;
  device: Device;
};

export async function postBackup({ folderName, device }: Props) {
  const { error, data } = await createBackupFolder(device.uuid, folderName);
  if (error) {
    logger.error({
      tag: 'BACKUPS',
      msg: 'Error creating backup folder',
      folderName,
      error: error,
    });
    return { error: error };
  }

  const backupData: Backup = {
    id: data.id,
    name: data.plainName,
    uuid: data.uuid,
  };

  return { data: backupData };
}
