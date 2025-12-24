import { FolderDtoWithPathname } from './device.types';
import { fetchFolder } from '../../../infra/drive-server/services/backup/services/fetch-folder';
import configStore from '../../../apps/main/config';
import { BackupInfo } from './../../../apps/backups/BackupInfo';
import { Device, findBackupPathnameFromId } from './../../../apps/main/device/service';
import { FolderDto } from '../../../infra/drive-server/out/dto';
import { mapFolderDtoToBackupInfo } from './utils/mapFolderDtoToBackupInfo';

export async function getBackupsFromDevice(device: Device, isCurrent?: boolean): Promise<Array<BackupInfo>> {
  const folder = await fetchFolder(device.uuid);
  if (isCurrent) {
    const backupsList = configStore.get('backupList');
    const result = folder.children
      .map((backup: FolderDto) => ({
        ...backup,
        pathname: findBackupPathnameFromId(backup.id),
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
