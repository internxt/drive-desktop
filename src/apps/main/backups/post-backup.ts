import { Device } from '../device/service';
import { Backup } from './types';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { createFolder } from '../../../infra/drive-server/services/folder/services/create-folder';
import { findBackupFolderByName } from './find-backup-folder-by-name';

type Props = {
  folderName: string;
  device: Device;
};

export async function postBackup({ folderName, device }: Props) {
  const { error, data } = await createFolder({ parentFolderUuid: device.uuid, plainName: folderName });
  if (data) {
    const backupData: Backup = {
      id: data.id,
      name: data.plainName,
      uuid: data.uuid,
    };

    return { data: backupData };
  }

  if (error.cause === 'CONFLICT') {
    logger.warn({
      tag: 'BACKUPS',
      msg: 'Backup folder already exists, restoring it to backup list',
      folderName,
      deviceUuid: device.uuid,
    });

    const existingFolder = await findBackupFolderByName({
      deviceUuid: device.uuid,
      folderName,
    });

    if (existingFolder) return { data: existingFolder };
  }

  logger.error({
    tag: 'BACKUPS',
    msg: 'Error creating backup folder',
    folderName,
    error,
  });

  return { error };
}
