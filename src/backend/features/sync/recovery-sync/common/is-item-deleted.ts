import { FileUuid, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { ParsedFileDto, ParsedFolderDto } from '@/infra/drive-server-wip/out/dto';

type Props = {
  ctx: SyncContext;
  type: 'file' | 'folder';
  checkpointDate: Date;
  local: SimpleDriveFile | SimpleDriveFolder;
  remotesMap: Map<FileUuid | FolderUuid, ParsedFileDto | ParsedFolderDto>;
};

export function isItemDeleted({ ctx, type, local, remotesMap, checkpointDate }: Props) {
  if (new Date(local.updatedAt) >= checkpointDate) {
    return false;
  }

  const remote = remotesMap.get(local.uuid);

  if (!remote) {
    ctx.logger.error({
      msg: 'Remote item does not exist',
      type,
      name: local.name,
      updatedAt: local.updatedAt,
    });

    return true;
  }

  return false;
}
