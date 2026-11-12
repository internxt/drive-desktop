import configStore from '../config';

type Props = {
  children: Array<{ id: number; uuid: string }>;
};

/**
 * v2.7.3 Alexis Mora
 * Migration (PB-6987):
 * backups created before Feb 2025 were stored in `backupList` with only the numeric `folderId`, and we now match backups by `folderUuid`.
 * We fill it by matching the stored `folderId` against the numeric `id` of the remote backup folders while the backend still returns real ids.
 * Once the backend returns dummy ids this migration has already run for those users,
 * so it can be deleted together with `folderId` in `BackupList`.
 */
export function migrateBackupFolderToUuids({ children }: Props) {
  const backupList = configStore.get('backupList');
  let changed = false;

  for (const backup of Object.values(backupList)) {
    if (backup.folderUuid || backup.folderId === undefined) continue;

    const child = children.find(({ id }) => id === backup.folderId);
    if (!child) continue;

    backup.folderUuid = child.uuid;
    changed = true;
  }

  if (changed) configStore.set('backupList', backupList);
}
