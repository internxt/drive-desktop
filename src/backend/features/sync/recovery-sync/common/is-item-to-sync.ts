import { FileUuid, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { ParsedFileDto, ParsedFolderDto } from '@/infra/drive-server-wip/out/dto';

type Props = {
  ctx: SyncContext;
  checkpointDate: Date;
  remote: ParsedFileDto | ParsedFolderDto;
  localsMap: Map<FileUuid | FolderUuid, SimpleDriveFile | SimpleDriveFolder>;
};

export function isItemToSync({ ctx, localsMap, remote, checkpointDate }: Props) {
  if (new Date(remote.updatedAt) >= checkpointDate) {
    return false;
  }

  const local = localsMap.get(remote.uuid);

  if (!local) {
    ctx.logger.error({
      msg: 'Local item does not exist',
      name: remote.plainName,
      updatedAt: remote.updatedAt,
    });

    return true;
  }

  if (local.updatedAt !== remote.updatedAt) {
    ctx.logger.error({
      msg: 'Local item has a different updatedAt',
      name: remote.plainName,
      localUpdatedAt: local.updatedAt,
      remoteUpdatedAt: remote.updatedAt,
    });

    return true;
  }

  return false;
}
