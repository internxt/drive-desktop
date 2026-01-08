import { moveItem } from './move-item';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  uuid: FileUuid;
};

export async function moveFile({ ctx, path, uuid }: TProps) {
  try {
    const { data: item, error } = await SqliteModule.FileModule.getByUuid({ uuid });

    if (error) throw error;

    await moveItem({ ctx, path, uuid, item, type: 'file' });
  } catch (exc) {
    ctx.logger.error({ msg: 'Error moving file', path, uuid, exc });
  }
}
