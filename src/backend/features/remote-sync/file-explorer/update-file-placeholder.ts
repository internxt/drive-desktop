import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { captureSentryPlaceholderSyncError } from '@/apps/shared/sentry/sentry';
import { SyncContext } from '@/apps/sync-engine/config';
import { validateWindowsName } from '@/context/virtual-drive/items/validate-windows-name';
import { Addon } from '@/node-win/addon-wrapper';
import { PinState } from '@/node-win/types/placeholder.type';
import { FileExplorerFiles } from '../sync-items-by-checkpoint/load-in-memory-paths';
import { checkIfModified } from './check-if-modified';
import { checkIfMoved } from './check-if-moved';

type Props = {
  ctx: SyncContext;
  remote: ExtendedDriveFile;
  files: FileExplorerFiles;
  isFirstExecution: boolean;
};

export async function updateFilePlaceholder({ ctx, remote, files, isFirstExecution }: Props) {
  const path = remote.absolutePath;
  const { size } = remote;

  try {
    const { isValid } = validateWindowsName({ path, name: remote.name });
    if (!isValid) return;

    const local = files.get(remote.uuid);

    if (!local) {
      await Addon.createFilePlaceholder({
        path,
        placeholderId: `FILE:${remote.uuid}`,
        size,
        creationTime: new Date(remote.createdAt).getTime(),
        lastWriteTime: new Date(remote.updatedAt).getTime(),
      });

      return;
    }

    await checkIfMoved({ ctx, type: 'file', remote, localPath: local.path });
    await checkIfModified({ ctx, local, remote, isFirstExecution });

    if (isFirstExecution) {
      // This situation can happen when the user performed an hydration of a folder with files inside and the
      // files didn't complete the hydration before the app closes. The files stay in a stuck state forever.
      // One option could be to resume the hydration, however, since when you hydrate a folder there is no way
      // to cancel the hydration, maybe the user has forced the close of the app to finish it. It can also be
      // the opposite, that the user wants to continue after opening the app again. We will keep the first use
      // case since it's easier to implement, consumes less resources and in case the user wants to hydrate the
      // folder he can perform the action again.
      const { onDiskSize } = local.placeholder;
      if (local.placeholder.pinState === PinState.AlwaysLocal && onDiskSize < size) {
        ctx.logger.debug({ msg: 'File stuck in hydrated state', onDiskSize, size, path });
        await Addon.setPinState({ path, pinState: PinState.Unspecified });
      }
    }
  } catch (error) {
    ctx.logger.error({ msg: 'Error updating file placeholder', path, error });
    await captureSentryPlaceholderSyncError({
      error,
      uuid: remote.uuid,
      type: 'file',
      operationType: 'update',
    });
  }
}
