import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { Addon } from '@/node-win/addon-wrapper';
import { PinState } from '@/node-win/types/placeholder.type';
import { Drive } from '../../drive';

type Props = {
  ctx: SyncContext;
  remote: ExtendedDriveFile;
  local: { path: AbsolutePath; mtime: Date; size: number };
  isFirstExecution: boolean;
};

export async function checkIfModified({ ctx, remote, local, isFirstExecution }: Props) {
  const path = remote.absolutePath;

  const localSize = local.size;
  const localDate = local.mtime;
  const remoteSize = remote.size;
  const remoteDate = new Date(remote.updatedAt);

  if (remoteSize === localSize) return;

  if (remoteDate > localDate) {
    ctx.logger.debug({
      msg: 'Sync remote changes to local',
      path,
      remoteSize,
      localSize,
      remoteDate,
      localDate,
    });

    await Addon.setPinState({ path, pinState: PinState.Unspecified });
    await Addon.updatePlaceholder({ path, placeholderId: `FILE:${remote.uuid}`, size: remoteSize });
    return;
  }

  if (isFirstExecution) {
    ctx.logger.debug({
      msg: 'Sync local changes to remote',
      path,
      remoteSize,
      localSize,
      remoteDate,
      localDate,
    });

    const { data: fileInfo } = await NodeWin.getFileInfo({ path });

    if (!fileInfo) return;

    if (localSize === fileInfo.onDiskSize) {
      await Drive.Actions.replaceFile({ ctx, path, uuid: remote.uuid });
    } else {
      ctx.logger.error({
        msg: 'Cannot update file contents id, not hydrated',
        path,
        localSize,
        onDiskSize: fileInfo.onDiskSize,
      });
    }
  }
}
