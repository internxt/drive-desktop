import { updateContentsId } from '@/apps/sync-engine/callbacks-controllers/controllers/update-contents-id';
import { handleDehydrate } from '@/apps/sync-engine/callbacks/handle-dehydrate';
import { throttleHydrate } from '@/apps/sync-engine/callbacks/handle-hydrate';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { PinState } from '@/node-win/types/placeholder.type';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type Props = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
};

export async function onChange({ ctx, path }: Props) {
  try {
    const { data: stats } = await fileSystem.stat({ absolutePath: path });

    if (!stats || stats.isDirectory()) return;

    const { data: fileInfo } = await NodeWin.getFileInfo({ path });

    if (!fileInfo) return;

    const now = Date.now();
    const isChanged = now - stats.ctimeMs <= 5000;
    const isModified = now - stats.mtimeMs <= 5000;

    ctx.logger.debug({
      msg: 'On change event',
      path,
      pinState: fileInfo.pinState,
      inSyncState: fileInfo.inSyncState,
      size: stats.size,
      onDiskSize: fileInfo.onDiskDataSize,
      isChanged,
      isModified,
    });

    if (isModified) {
      await updateContentsId({ ctx, stats, path, uuid: fileInfo.uuid });
    }

    if (isChanged) {
      if (fileInfo.pinState === PinState.AlwaysLocal && fileInfo.onDiskDataSize === 0) {
        await throttleHydrate({ ctx, path });
      }

      if (fileInfo.pinState === PinState.OnlineOnly) {
        if (stats.size === 0 || fileInfo.onDiskDataSize !== 0) {
          await handleDehydrate({ ctx, path });
        }
      }
    }
  } catch (error) {
    ctx.logger.error({ msg: 'Error on change event', path, error });
  }
}
