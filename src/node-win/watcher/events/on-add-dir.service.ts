import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { moveFolder } from '@/backend/features/local-sync/watcher/events/rename-or-move/move-folder';
import { trackAddFolderEvent } from '@/backend/features/local-sync/watcher/events/unlink/is-move-event';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { createFolder } from '@/features/sync/add-item/create-folder';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
};

export async function onAddDir({ ctx, path }: TProps) {
  try {
    const { data: folderInfo, error } = await NodeWin.getFolderInfo({ ctx, path });

    if (error) {
      if (error.code === 'NOT_A_PLACEHOLDER') await createFolder({ ctx, path });
      else throw error;
      return;
    }

    trackAddFolderEvent({ uuid: folderInfo.uuid });
    await moveFolder({ ctx, path, uuid: folderInfo.uuid });
  } catch (error) {
    ctx.logger.error({ msg: 'Error on event "addDir"', error });
  }
}
