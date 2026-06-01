import path from 'node:path';
import { Device } from './types/Device';
import configStore from '../../../apps/main/config';
import { BackupInfo } from '../../../apps/backups/BackupInfo';
import { app } from 'electron';
import { createBackupFolder } from '../../../backend/features/backup/create-backup-folder';
import { AbsolutePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import { Result } from '../../../context/shared/domain/Result';

type Props = {
  pathname: AbsolutePath;
  device: Device;
};

export async function createBackup({ pathname, device }: Props): Promise<Result<BackupInfo, Error>> {
  const { base } = path.parse(pathname);
  const { error, data: newBackup } = await createBackupFolder({ folderName: base, device });
  if (error) return { error };

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
    pathname,
    name: base,
    tmpPath: app.getPath('temp'),
    backupsBucket: device.bucket,
  };

  return { data: createdBackup };
}
