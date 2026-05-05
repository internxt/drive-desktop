import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { moveItem } from './move-item';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  uuid: FolderUuid;
};

export async function moveFolder({ ctx, path, uuid }: TProps) {
  try {
    const { data: item, error } = await SqliteModule.FolderModule.getByUuid({ uuid });

    if (error) throw error;

    await moveItem({ ctx, path, uuid, item, type: 'folder' });
  } catch (exc) {
    ctx.logger.sentryError({ msg: 'Error moving folder', path, exc }, { uuid, operationType: 'move' });
  }
}
