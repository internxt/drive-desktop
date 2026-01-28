import { NodeWin } from '@/infra/node-win/node-win.module';
import { AbsolutePath, dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { moveFile } from '@/backend/features/local-sync/watcher/events/rename-or-move/move-file';
import { trackAddEvent } from '@/backend/features/local-sync/watcher/events/unlink/is-move-event';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { Drive } from '@/backend/features/drive';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
};

export async function onAdd({ ctx, path }: TProps) {
  try {
    const { data: fileInfo } = await NodeWin.getFileInfo({ path });

    if (fileInfo) {
      trackAddEvent({ uuid: fileInfo.uuid });
      await moveFile({ ctx, path, uuid: fileInfo.uuid });
      return;
    }

    const { data: parentInfo } = await NodeWin.getFolderInfo({ ctx, path: dirname(path) });

    if (parentInfo) {
      await Drive.Actions.createFile({
        ctx,
        path,
        parentUuid: parentInfo.uuid,
      });
    }
  } catch (error) {
    ctx.logger.error({ msg: 'Error on add event', path, error });
  }
}
