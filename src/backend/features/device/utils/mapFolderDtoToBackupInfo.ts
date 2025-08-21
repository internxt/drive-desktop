import { FolderDtoWithPathname } from './../device.types';
import { BackupInfo } from './../../../../apps/backups/BackupInfo';
import { app } from 'electron';

export function mapFolderDtoToBackupInfo(backup: FolderDtoWithPathname): BackupInfo {
  return {
    name: backup.plainName,
    pathname: backup.pathname,
    folderId: backup.id,
    folderUuid: backup.uuid,
    tmpPath: app.getPath('temp'),
    backupsBucket: backup.bucket,
  };
}
