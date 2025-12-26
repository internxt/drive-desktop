import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { basename } from 'node:path';
import { getParentUuid } from './get-parent-uuid';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { isMoveFileEvent } from './is-move-event';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { deleteFileByUuid } from '@/infra/drive-server-wip/out/ipc-main';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
};

export async function unlinkFile({ ctx, path }: TProps) {
  try {
    const parentUuid = await getParentUuid({ ctx, path });
    if (!parentUuid) return;

    const nameWithExtension = basename(path);
    const { data: file } = await SqliteModule.FileModule.getByName({ parentUuid, nameWithExtension });

    if (!file) return;

    const isMove = await isMoveFileEvent({ uuid: file.uuid });
    if (isMove) {
      ctx.logger.debug({ msg: 'Is move event', path });
      return;
    }

    ctx.logger.debug({ msg: 'File unlinked', path });

    await deleteFileByUuid({
      uuid: file.uuid,
      workspaceToken: ctx.workspaceToken,
      path,
    });
  } catch (exc) {
    ctx.logger.error({ msg: 'Error on unlink file', path, exc });
  }
}
