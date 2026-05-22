import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { basename } from 'node:path';
import { handleDehydrate } from '@/apps/sync-engine/callbacks/handle-dehydrate';
import { throttleHydrate } from '@/apps/sync-engine/callbacks/handle-hydrate';
import { SyncContext } from '@/apps/sync-engine/config';
import { Drive } from '@/backend/features/drive';
import { moveFile } from '@/backend/features/local-sync/watcher/events/rename-or-move/move-file';
import { dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { Watcher } from '@/node-win/addon';
import { Addon } from '@/node-win/addon-wrapper';
import { InSyncState, PinState } from '@/node-win/types/placeholder.type';

type Props = {
  ctx: SyncContext;
  event: Watcher.SuccessEvent;
  path: AbsolutePath;
};

export async function onChange({ ctx, event, path }: Props) {
  const { data: fileInfo } = await NodeWin.getFileInfo({ path });

  if (!fileInfo) {
    await handleNonPlaceholderFile(ctx, path);
    return;
  }

  const now = Date.now();
  const isChanged = now - event.ctimeMs <= 5000;
  const isModified = now - event.mtimeMs <= 5000;

  ctx.logger.debug({
    msg: 'On change event',
    path,
    pinState: fileInfo.pinState,
    inSyncState: fileInfo.inSyncState,
    size: event.size,
    onDiskSize: fileInfo.onDiskSize,
    isChanged,
    isModified,
  });

  if (isModified && fileInfo.inSyncState === InSyncState.NotSync) {
    await Drive.Actions.replaceFile({ ctx, path, uuid: fileInfo.uuid });
  }

  if (isChanged) {
    if (fileInfo.pinState === PinState.AlwaysLocal && fileInfo.onDiskSize === 0) {
      await throttleHydrate({ ctx, path });
    }

    if (fileInfo.pinState === PinState.OnlineOnly) {
      if (event.size === 0 || fileInfo.onDiskSize !== 0) {
        await handleDehydrate({ ctx, path });
      }
    }

    if (fileInfo.inSyncState === InSyncState.NotSync) {
      await moveFile({ ctx, path, uuid: fileInfo.uuid });
    }
  }
}

async function handleNonPlaceholderFile(ctx: SyncContext, path: AbsolutePath) {
  const { data: parentInfo } = await NodeWin.getFolderInfo({ ctx, path: dirname(path) });

  if (parentInfo) {
    const nameWithExtension = basename(path);
    const parentUuid = parentInfo.uuid;

    const { data: file } = await SqliteModule.FileModule.getByName({ parentUuid, nameWithExtension });

    if (file) {
      await Addon.convertToPlaceholder({ path, placeholderId: `FILE:${file.uuid}` });
      await Drive.Actions.replaceFile({ ctx, path, uuid: file.uuid });
    } else {
      await Drive.Actions.createFile({ ctx, path, parentUuid });
    }
  }
}
