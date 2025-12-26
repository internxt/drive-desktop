import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { basename } from 'node:path';
import { getParentUuid } from './get-parent-uuid';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { isMoveFolderEvent } from './is-move-event';
import { deleteFolderByUuid } from '@/infra/drive-server-wip/out/ipc-main';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
};

export async function unlinkFolder({ ctx, path }: TProps) {
  try {
    const parentUuid = await getParentUuid({ path, ctx });
    if (!parentUuid) return;

    const plainName = basename(path);
    const { data: folder } = await SqliteModule.FolderModule.getByName({ parentUuid, plainName });

    if (!folder) return;

    const isMove = await isMoveFolderEvent({ uuid: folder.uuid });
    if (isMove) {
      ctx.logger.debug({ msg: 'Is move event', path });
      return;
    }

    ctx.logger.debug({ msg: 'Folder unlinked', path });

    await deleteFolderByUuid({
      uuid: folder.uuid,
      workspaceToken: ctx.workspaceToken,
      path,
    });
  } catch (exc) {
    ctx.logger.error({ msg: 'Error on unlink folder', path, exc });
  }
}
