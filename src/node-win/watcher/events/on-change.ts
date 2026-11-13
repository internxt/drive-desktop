import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { basename } from 'node:path';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { handleDehydrate } from '@/apps/sync-engine/callbacks/handle-dehydrate';
import { throttleHydrate } from '@/apps/sync-engine/callbacks/handle-hydrate';
import { SyncContext } from '@/apps/sync-engine/config';
import { isTemporaryFile } from '@/apps/utils/isTemporalFile';
import { Drive } from '@/backend/features/drive';
import { moveFile } from '@/backend/features/local-sync/watcher/events/rename-or-move/move-file';
import { dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { Watcher } from '@/node-win/addon';
import { Addon } from '@/node-win/addon-wrapper';
import { InSyncState, PinState } from '@/node-win/types/placeholder.type';
import { findPlaceholderByUuid } from './find-placeholder-by-uuid';

type Props = {
  ctx: SyncContext;
  event: Watcher.SuccessEvent;
  path: AbsolutePath;
  observedAtMs: number;
};

export async function onChange({ ctx, event, path, observedAtMs }: Props) {
  const { data: fileInfo } = await NodeWin.getFileInfo({ path });

  if (!fileInfo) {
    await handleNonPlaceholderFile(ctx, path);
    return;
  }

  const isChanged = wasRecentWhenObserved({ observedAtMs, timestamp: event.ctimeMs });
  const isModified = wasRecentWhenObserved({ observedAtMs, timestamp: event.mtimeMs });

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
      await moveIfNotTemporary({ ctx, path, uuid: fileInfo.uuid });
    }
  }
}

// TODO: PB-XXXX Replace the watcher timestamp heuristic.
function wasRecentWhenObserved({ observedAtMs, timestamp }: { observedAtMs: number; timestamp: number }) {
  return observedAtMs - timestamp <= 5000;
}

async function moveIfNotTemporary({ ctx, path, uuid }: { ctx: SyncContext; path: AbsolutePath; uuid: FileUuid }) {
  if (isTemporaryFile({ path })) {
    ctx.logger.debug({ msg: 'File renamed to a temporary name, skipping move', path });
    return;
  }

  await moveFile({ ctx, path, uuid });
}

async function handleNonPlaceholderFile(ctx: SyncContext, path: AbsolutePath) {
  const { data: parentInfo } = await NodeWin.getFolderInfo({ ctx, path: dirname(path) });

  if (parentInfo) {
    const nameWithExtension = basename(path);
    const parentUuid = parentInfo.uuid;

    const { data: file } = await SqliteModule.FileModule.getByName({ parentUuid, nameWithExtension });

    if (file && !(await isUuidKeptByRenamedFile({ ctx, path, uuid: file.uuid }))) {
      await Addon.convertToPlaceholder({ path, placeholderId: `FILE:${file.uuid}`, markInSync: false });
      await Drive.Actions.replaceFile({ ctx, path, uuid: file.uuid });
    } else {
      await Drive.Actions.createFile({ ctx, path, parentUuid });
    }
  }
}

/**
 * v2.7.4 Victor Fernandez
 * Adopting the uuid by name is meant for apps that delete the file and write a new one with the same name. Some apps
 * (e.g. Revit) instead rename the original to a backup with a regular name and keep it. Adopting its uuid would leave
 * two files with the same uuid and the remote sync would later rename the document to the backup name. SQLite cannot
 * tell these cases apart because the rename has not been persisted yet, so we look at the folder. A temporary copy
 * (e.g. Word's ~WRL) is not uploaded, so the document must keep the uuid.
 */
async function isUuidKeptByRenamedFile({ ctx, path, uuid }: { ctx: SyncContext; path: AbsolutePath; uuid: FileUuid }) {
  const { data: holder } = await findPlaceholderByUuid({ folder: dirname(path), uuid });
  if (!holder || isTemporaryFile({ path: holder })) return false;

  ctx.logger.debug({ msg: 'File uuid kept by a renamed file, creating a new file', path, holder });
  return true;
}
