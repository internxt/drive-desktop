import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { FileProps, FolderProps } from '../recovery-sync.types';

type Props = FileProps | FolderProps;

export function getDeletedItems(props: FolderProps): SimpleDriveFolder[];
export function getDeletedItems(props: FileProps): SimpleDriveFile[];
export function getDeletedItems({ ctx, remotes, locals }: Props) {
  const remotesMap = new Map(remotes.map((file) => [file.uuid, file]));

  const filesToDelete = locals.filter((local) => {
    const remote = remotesMap.get(local.uuid);

    if (!remote) {
      ctx.logger.error({
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
