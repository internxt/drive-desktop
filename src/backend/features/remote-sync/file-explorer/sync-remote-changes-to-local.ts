import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { existsSync, Stats } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { Addon } from '@/node-win/addon-wrapper';

type Props = {
  ctx: ProcessSyncContext;
  remote: ExtendedDriveFile;
  local: { path: AbsolutePath; stats: Stats };
};

export async function syncRemoteChangesToLocal({ ctx, remote, local }: Props) {
  const remoteDate = new Date(remote.updatedAt);

  if (remote.size !== local.stats.size && remoteDate > local.stats.mtime) {
    ctx.logger.debug({
      msg: 'Syncing remote changes to local',
      path: remote.absolutePath,
      remoteSize: remote.size,
      localSize: local.stats.size,
      remoteDate: remoteDate.toISOString(),
      localDate: local.stats.mtime.toISOString(),
    });

    try {
      if (existsSync(local.path)) {
        await unlink(local.path);
        ctx.logger.debug({
          msg: 'Deleted old local file to prepare for remote sync',
          path: remote.absolutePath,
        });
      }

      await Addon.createFilePlaceholder({
        path: remote.absolutePath,
        placeholderId: `FILE:${remote.uuid}`,
        size: remote.size,
        creationTime: new Date(remote.createdAt).getTime(),
        lastWriteTime: new Date(remote.updatedAt).getTime(),
      });

      ctx.logger.debug({
        msg: 'File successfully synced from remote to local',
        path: remote.absolutePath,
        newSize: remote.size,
      });
    } catch (error) {
      ctx.logger.error({
        msg: 'Error syncing remote changes to local',
        path: remote.absolutePath,
        error,
      });
    }
  }
}
