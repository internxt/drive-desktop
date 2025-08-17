import { logger } from '@/apps/shared/logger/logger';
import { fetchFoldersByFolder } from './fetch-folders-by-folder';
import { SyncContext } from '@/apps/sync-engine/config';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { updateItems } from './update-items/update-items';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { createRelativePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

type TProps = {
  context: SyncContext;
  folderUuid: FolderUuid;
  path: RelativePath;
};

export async function updateFolderStatuses({ context, folderUuid, path }: TProps) {
  let innerFolders: Array<{ folderUuid: FolderUuid; path: RelativePath }> = [];

  try {
    const folderDtos = await fetchFoldersByFolder({ context, folderUuid });

    if (!folderDtos) return;

    innerFolders = folderDtos.map((folderDto) => ({
      folderUuid: folderDto.uuid,
      path: createRelativePath(path, folderDto.plainName),
    }));

    const uuids = folderDtos.map((folderDto) => folderDto.uuid);
    const { data: folders } = await SqliteModule.FolderModule.getByUuids({ uuids });

    if (folders) {
      void updateItems({
        context,
        parentPath: path,
        type: 'folder',
        itemDtos: folderDtos,
        items: folders,
      });
    }
  } catch (exc) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Update folder statuses failed',
      path,
      folderUuid,
      exc,
    });
  }

  return innerFolders;
}
