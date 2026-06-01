import configStore from '../../../apps/main/config';
import { BackupInfo } from '../../../apps/backups/BackupInfo';
import { parse } from 'node:path';
import { fetchFolder } from '../../../infra/drive-server/services/folder/services/fetch-folder';
import { createBackup } from './create-backup';
import { migrateBackupEntryIfNeeded } from './migrate-backup-entry-if-needed';
import { Device } from './types/Device';
import { AbsolutePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import { PATHS } from '../../../core/electron/paths';
import { Result } from '../../../context/shared/domain/Result';
import { BackupEntry } from './types/BackupEntry';

type Props = {
  pathname: AbsolutePath;
  device: Device;
};

async function resolveBackupEntry({
  pathname,
  backup,
}: {
  pathname: AbsolutePath;
  backup: BackupEntry;
}): Promise<Result<BackupEntry, Error>> {
  if (backup.folderUuid) {
    return { data: backup };
  }

  return migrateBackupEntryIfNeeded({ pathname, backup });
}

function markBackupAsEnabled({ pathname }: { pathname: AbsolutePath }) {
  const backupList = configStore.get('backupList');
  configStore.set('backupList', { ...backupList, [pathname]: { ...backupList[pathname], enabled: true } });
}

function buildBackupInfo({
  pathname,
  backup,
  device,
}: {
  pathname: AbsolutePath;
  backup: BackupEntry;
  device: Device;
}): BackupInfo {
  const { base } = parse(pathname);
  return {
    folderUuid: backup.folderUuid,
    folderId: backup.folderId,
    pathname,
    name: base,
    tmpPath: PATHS.TEMPORAL_FOLDER,
    backupsBucket: device.bucket,
  };
}

export async function enableExistingBackup({ pathname, device }: Props): Promise<Result<BackupInfo, Error>> {
  const backupList = configStore.get('backupList');
  const rawBackup = backupList[pathname];

  const { data: backup, error } = await resolveBackupEntry({ pathname, backup: rawBackup });
  if (error) return { error };

  const { error: fetchError } = await fetchFolder(backup.folderUuid);
  if (fetchError) {
    const { data, error } = await createBackup({ pathname, device });
    if (error) return { error };

    return { data };
  }

  markBackupAsEnabled({ pathname });
  const backupInfo = buildBackupInfo({ pathname, backup, device });

  return { data: backupInfo };
}
