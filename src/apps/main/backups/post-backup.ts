import { Device } from '../device/service';
import { Backup } from './types';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { createFolder } from '../../../infra/drive-server/services/folder/services/create-folder';

type Props = {
  folderName: string;
  device: Device;
};

export async function postBackup({ folderName, device }: Props) {
  const { error, data } = await createFolder({ parentFolderUuid: device.uuid, plainName: folderName });
  if (error) {
    logger.error({
      tag: 'BACKUPS',
      msg: 'Error creating backup folder',
      folderName,
      error,
    });
    return { error };
  }

  const backupData: Backup = {
    id: data.id,
    name: data.plainName,
    uuid: data.uuid,
  };

  return { data: backupData };
}
