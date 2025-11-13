import path from 'node:path';
import { Device } from '../device/service';
import configStore from '../config';
import { BackupInfo } from 'src/apps/backups/BackupInfo';
import { app } from 'electron';
import { postBackup } from './post-backup';

type Props = {
  pathname: string;
  device: Device;
};

export async function createBackup({ pathname, device }: Props) {
  const { base } = path.parse(pathname);
  const { error, data: newBackup } = await postBackup({ folderName: base, device });
  if (error) return;

  const backupList = configStore.get('backupList');
  backupList[pathname] = {
    enabled: true,
    folderId: newBackup.id,
    folderUuid: newBackup.uuid,
  };

  configStore.set('backupList', backupList);

  const createdBackup: BackupInfo = {
    folderUuid: newBackup.uuid,
    folderId: newBackup.id,
    pathname: pathname,
    name: base,
    tmpPath: app.getPath('temp'),
    backupsBucket: device.bucket,
  };

  return createdBackup;
}
