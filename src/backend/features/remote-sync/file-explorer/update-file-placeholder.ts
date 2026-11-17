import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SyncContext } from '@/apps/sync-engine/config';
import { validateWindowsName } from '@/context/virtual-drive/items/validate-windows-name';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { Addon } from '@/node-win/addon-wrapper';
import { PinState } from '@/node-win/types/placeholder.type';
import { FileExplorerFile, FileExplorerFiles } from '../sync-items-by-checkpoint/load-in-memory-paths';
import { checkIfModified } from './check-if-modified';
import { checkIfMoved } from './check-if-moved';

type Props = {
  ctx: SyncContext;
  remote: ExtendedDriveFile;
  files: FileExplorerFiles;
  isFirstExecution: boolean;
};

/**
 * Synchronizes a local Windows file placeholder with its remote file metadata and state.
 *
 * @param remote - The remote file to synchronize.
 * @param files - Local files indexed by remote UUID.
 * @param isFirstExecution - Whether this is the first synchronization after startup.
 */
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
        creationTime: new Date(remote.creationTime).getTime(),
        lastWriteTime: new Date(remote.modificationTime).getTime(),
      });

      return;
    }

    const isInPlace = await checkIfMoved({ ctx, type: 'file', remote, local });
    const localPath = isInPlace ? path : await getPathIfNotDuplicated({ remote, local });
    if (!localPath) return;

    await checkIfModified({ ctx, path: localPath, local, remote, isFirstExecution });

    if (isFirstExecution) {
      // This situation can happen when the user performed an hydration of a folder with files inside and the
      // files didn't complete the hydration before the app closes. The files stay in a stuck state forever.
      // One option could be to resume the hydration, however, since when you hydrate a folder there is no way
      // to cancel the hydration, maybe the user has forced the close of the app to finish it. It can also be
      // the opposite, that the user wants to continue after opening the app again. We will keep the first use
      // case since it's easier to implement, consumes less resources and in case the user wants to hydrate the
      // folder he can perform the action again.
      const { onDiskSize } = local;
      if (local.pinState === PinState.AlwaysLocal && onDiskSize < size) {
        ctx.logger.debug({ msg: 'File stuck in hydrated state', onDiskSize, size, path: localPath });
        await Addon.setPinState({ path: localPath, pinState: PinState.Unspecified });
      }
    }
  } catch (error) {
    ctx.logger.sentryError({ msg: 'Error updating file placeholder', path, error }, { uuid: remote.uuid });
  }
}

/**
 * v2.7.4 Victor Fernandez
 * When the file cannot be moved to its remote path, its changes are still checked at its current local path, so that
 * edits made while the app was closed are uploaded. If the item at the remote path has the same uuid, both files are
 * duplicates and the check is skipped, because syncing this one could replace the remote content with the other file's.
 */
async function getPathIfNotDuplicated({ remote, local }: { remote: ExtendedDriveFile; local: FileExplorerFile }) {
  const { data: placeholder } = await NodeWin.getFileInfo({ path: remote.absolutePath });
  if (placeholder?.uuid === remote.uuid) return;
  return local.path;
}
