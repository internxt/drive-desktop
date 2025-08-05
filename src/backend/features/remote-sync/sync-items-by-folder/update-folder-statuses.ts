import { logger } from '@/apps/shared/logger/logger';
import { fetchFoldersByFolder } from './fetch-folders-by-folder';
import { SyncContext } from '@/apps/sync-engine/config';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { updateItems } from './update-items/update-items';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

type TProps = {
  context: SyncContext;
  folderUuid: string;
};

export async function updateFolderStatuses({ context, folderUuid }: TProps) {
  let folderUuids: FolderUuid[] = [];

  try {
    const folderDtos = await fetchFoldersByFolder({ context, folderUuid });

    const { data: folders } = await SqliteModule.FolderModule.getByParentUuid({ parentUuid: folderUuid });

    if (folderDtos) {
      folderUuids = folderDtos.map((folder) => folder.uuid);

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
      folderUuid,
      exc,
    });
  }

  return folderUuids;
}
