import { updateContentsId } from '@/apps/sync-engine/callbacks-controllers/controllers/update-contents-id';
import { handleDehydrate } from '@/apps/sync-engine/callbacks/handle-dehydrate';
import { throttleHydrate } from '@/apps/sync-engine/callbacks/handle-hydrate';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { PinState } from '@/node-win/types/placeholder.type';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { stat } from 'node:fs/promises';

type Props = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
};

export async function onChange({ ctx, path }: Props) {
  try {
    const stats = await stat(path);

    if (stats.isDirectory()) return;

    const { data: fileInfo, error } = await NodeWin.getFileInfo({ path });

    if (error) throw error;

    const now = Date.now();
    const isChanged = now - stats.ctimeMs <= 5000;
    const isModified = now - stats.mtimeMs <= 5000;

    ctx.logger.debug({
      msg: 'On change event',
      path,
      pinState: fileInfo.pinState,
      blocks: stats.blocks,
      ctime: stats.ctime,
      mtime: stats.mtime,
      isChanged,
      isModified,
    });

    if (isModified && fileInfo.pinState === PinState.AlwaysLocal) {
      await updateContentsId({ ctx, stats, path, uuid: fileInfo.uuid });
    }

    if (isChanged) {
      if (fileInfo.pinState === PinState.AlwaysLocal && stats.blocks === 0) {
        await throttleHydrate({ ctx, path });
      }

      if (fileInfo.pinState === PinState.OnlineOnly && stats.blocks !== 0) {
        await handleDehydrate({ ctx, path });
      }
    }
  } catch (error) {
    ctx.logger.error({ msg: 'Error on change event', path, error });
  }
}
