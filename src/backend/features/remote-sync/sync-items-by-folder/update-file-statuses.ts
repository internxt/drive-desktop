import { fetchFilesByFolder } from './fetch-files-by-folder';
import { logger } from '@/apps/shared/logger/logger';
import { SyncContext } from '@/apps/sync-engine/config';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { updateItems } from './update-items/update-items';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

type TProps = {
  context: SyncContext;
  path: RelativePath;
  folderUuid: FolderUuid;
};

export async function updateFileStatuses({ context, path, folderUuid }: TProps) {
  try {
    const fileDtos = await fetchFilesByFolder({ context, folderUuid });

    if (!fileDtos) return;

    const uuids = fileDtos.map((fileDto) => fileDto.uuid);
    const { data: files } = await SqliteModule.FileModule.getByUuids({ uuids });

    if (!files) return;

    void updateItems({
      context,
      parentPath: path,
      type: 'file',
      itemDtos: fileDtos,
      items: files,
    });
  } catch (exc) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Update file statuses failed',
      folderUuid,
      exc,
    });
  }
}
