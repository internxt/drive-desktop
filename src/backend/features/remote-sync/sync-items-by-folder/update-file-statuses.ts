import { fetchFilesByFolder } from './fetch-files-by-folder';
import { logger } from '@/apps/shared/logger/logger';
import { SyncContext } from '@/apps/sync-engine/config';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { updateItems } from './update-items/update-items';

type TProps = {
  context: SyncContext;
  folderUuid: string;
};

export async function updateFileStatuses({ context, folderUuid }: TProps) {
  try {
    const [fileDtos, { data: files }] = await Promise.all([
      fetchFilesByFolder({ context, folderUuid }),
      SqliteModule.FileModule.getByParentUuid({ parentUuid: folderUuid }),
    ]);

    if (fileDtos && files) {
      void updateItems({
        context,
        type: 'file',
        itemDtos: fileDtos,
        items: files,
      });
    }
  } catch (exc) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Update file statuses failed',
      folderUuid,
      exc,
    });
  }
}
