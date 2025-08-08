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
    const [folderDtos, { data: folders }] = await Promise.all([
      fetchFoldersByFolder({ context, folderUuid }),
      SqliteModule.FolderModule.getByParentUuid({ parentUuid: folderUuid }),
    ]);

    if (folderDtos) {
      innerFolders = folderDtos.map((folder) => ({
        folderUuid: folder.uuid,
        path: createRelativePath(path, folder.plainName),
      }));

      if (folders) {
        void updateItems({
          context,
          type: 'folder',
          itemDtos: folderDtos,
          items: folders,
        });
      }
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
