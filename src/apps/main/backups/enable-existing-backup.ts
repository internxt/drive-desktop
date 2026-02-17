import configStore from '../config';
import { BackupInfo } from 'src/apps/backups/BackupInfo';
import path from 'node:path';
import { app } from 'electron';
import { fetchFolder } from '../../../infra/drive-server/services/folder/services/fetch-folder';
import { createBackup } from './create-backup';
import { migrateBackupEntryIfNeeded } from '../device/migrate-backup-entry-if-needed';
import { Device } from '../device/service';

export async function enableExistingBackup(pathname: string, device: Device) {
  const backupList = configStore.get('backupList');
  const existingBackup = backupList[pathname];

  const migratedBackup = await migrateBackupEntryIfNeeded(pathname, existingBackup);

  const { error } = await fetchFolder(migratedBackup.folderUuid);

  if (error) {
    return await createBackup({ pathname, device });
  }

  const updatedBackupList = configStore.get('backupList');
  updatedBackupList[pathname].enabled = true;
  configStore.set('backupList', updatedBackupList);

  const { base } = path.parse(pathname);
  const backupInfo: BackupInfo = {
    folderUuid: migratedBackup.folderUuid,
    folderId: migratedBackup.folderId,
    pathname,
    name: base,
    tmpPath: app.getPath('temp'),
    backupsBucket: device.bucket,
  };

  return backupInfo;
}
