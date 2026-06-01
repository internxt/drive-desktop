import { FolderDtoWithPathname } from './device.types';
import { fetchFolder } from '../../../infra/drive-server/services/folder/services/fetch-folder';
import configStore from '../../../apps/main/config';
import { BackupInfo } from './../../../apps/backups/BackupInfo';
import { Device } from '../backup/types/Device';
import { FolderDto } from '../../../infra/drive-server/out/dto';
import { mapFolderDtoToBackupInfo } from './utils/mapFolderDtoToBackupInfo';
import { findBackupPathnameFromId } from '../backup/find-backup-pathname-from-id';

export async function getBackupsFromDevice(device: Device, isCurrent?: boolean): Promise<Array<BackupInfo>> {
  const { data: folder, error } = await fetchFolder(device.uuid);
  if (error) {
    throw error;
  }
  if (isCurrent) {
    const backupsList = configStore.get('backupList');
    const result = folder.children
      .map((backup: FolderDto) => ({
        ...backup,
        pathname: findBackupPathnameFromId({ id: backup.id }),
      }))
      .filter((backup): backup is FolderDtoWithPathname => {
        return !!(backup.pathname && backupsList[backup.pathname]?.enabled);
      })
      .map(mapFolderDtoToBackupInfo);
    return result;
  } else {
    const result = folder.children.map((backup) => ({
      name: backup.plainName,
      pathname: '',
      folderId: backup.id,
      folderUuid: backup.uuid,
      tmpPath: '',
      backupsBucket: device.bucket,
    }));
    return result;
  }
}
