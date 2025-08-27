import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { PinState } from '@/node-win/types/placeholder.type';
import { logger } from '@/apps/shared/logger/logger';
import VirtualDrive from '@/node-win/virtual-drive';
import { existsSync, Stats } from 'fs';
import { unlink } from 'fs/promises';

type Props = {
  virtualDrive: VirtualDrive;
  remote: ExtendedDriveFile;
  local: { path: AbsolutePath; stats: Stats };
};

export async function syncRemoteChangesToLocal({ remote, local, virtualDrive }: Props) {
  const remoteDate = new Date(remote.updatedAt);
  const placeholderState = virtualDrive.getPlaceholderState({ path: local.path });
  const { pinState } = placeholderState;
  if (pinState === PinState.AlwaysLocal && remote.size !== local.stats.size && remoteDate > local.stats.mtime) {
    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Syncing remote changes to local',
      remotePath: remote.absolutePath,
      local,
      remoteSize: remote.size,
      localSize: local.stats.size,
      remoteDate: remoteDate.toISOString(),
      localDate: local.stats.mtime.toISOString(),
    });

    try {
      if (existsSync(local.path)) {
        await unlink(local.path);
        logger.debug({
          tag: 'SYNC-ENGINE',
          msg: 'Deleted old local file to prepare for remote sync',
          local,
        });
      }

      virtualDrive.createFileByPath({
        itemPath: remote.path,
        itemId: `FILE:${remote.uuid}`,
        size: remote.size,
        creationTime: new Date(remote.createdAt).getTime(),
        lastWriteTime: new Date(remote.updatedAt).getTime(),
      });

      await virtualDrive.hydrateFile({ itemPath: remote.path });

      logger.debug({
        tag: 'SYNC-ENGINE',
        msg: 'File successfully synced from remote to local',
        uuid: remote.uuid,
        local,
        newSize: remote.size,
      });
    } catch (error) {
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error syncing remote changes to local',
        uuid: remote.uuid,
        local,
        error,
      });
    }
  }
}
