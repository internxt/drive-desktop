import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { Stats } from 'node:fs';
import { SyncContext } from '@/apps/sync-engine/config';
import { Addon } from '@/node-win/addon-wrapper';
import { PinState } from '@/node-win/types/placeholder.type';

type Props = {
  ctx: SyncContext;
  remote: ExtendedDriveFile;
  local: { path: AbsolutePath; stats: Stats };
};

export async function syncRemoteChangesToLocal({ ctx, remote, local }: Props) {
  const path = remote.absolutePath;
  const remoteDate = new Date(remote.updatedAt);

  if (remote.size !== local.stats.size && remoteDate > local.stats.mtime) {
    ctx.logger.debug({
      msg: 'Sync remote changes to local',
      path,
      remoteSize: remote.size,
      localSize: local.stats.size,
      remoteDate,
      localDate: local.stats.mtime,
    });

    try {
      await Addon.setPinState({ path, pinState: PinState.Unspecified });
      await Addon.updatePlaceholder({ path, placeholderId: `FILE:${remote.uuid}`, size: remote.size });
    } catch (error) {
      ctx.logger.error({
        msg: 'Error syncing remote changes to local',
        path,
        error,
      });
    }
  }
}
