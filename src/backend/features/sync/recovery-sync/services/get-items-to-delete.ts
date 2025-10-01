import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { FileProps, FolderProps } from '../recovery-sync.types';

type Props = FileProps | FolderProps;

export function getItemsToDelete(props: FolderProps): SimpleDriveFolder[];
export function getItemsToDelete(props: FileProps): SimpleDriveFile[];
export function getItemsToDelete({ remotes, locals }: Props) {
  const remotesMap = new Map(remotes.map((file) => [file.uuid, file]));

  const filesToDelete = locals.filter((local) => {
    const remote = remotesMap.get(local.uuid);

    if (!remote) {
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Remote file does not exist',
        name: local.name,
        updatedAt: local.updatedAt,
      });

      return true;
    }

    return false;
  });

  return filesToDelete;
}
