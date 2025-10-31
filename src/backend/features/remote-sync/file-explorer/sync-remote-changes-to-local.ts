import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { logger } from '@/apps/shared/logger/logger';
import VirtualDrive from '@/node-win/virtual-drive';
import { existsSync, Stats } from 'node:fs';
import { unlink } from 'node:fs/promises';

type Props = {
  virtualDrive: VirtualDrive;
  remote: ExtendedDriveFile;
  local: { absolutePath: AbsolutePath; stats: Stats };
};

export async function syncRemoteChangesToLocal({ remote, local, virtualDrive }: Props) {
  const remoteDate = new Date(remote.updatedAt);
  if (remote.size !== local.stats.size && remoteDate > local.stats.mtime) {
    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Syncing remote changes to local',
      path: remote.path,
      remoteSize: remote.size,
      localSize: local.stats.size,
      remoteDate: remoteDate.toISOString(),
      localDate: local.stats.mtime.toISOString(),
    });

    try {
      if (existsSync(local.absolutePath)) {
        await unlink(local.absolutePath);
        logger.debug({
          tag: 'SYNC-ENGINE',
          msg: 'Deleted old local file to prepare for remote sync',
          path: remote.path,
        });
      }

      virtualDrive.createFileByPath({
        path: remote.absolutePath,
        placeholderId: `FILE:${remote.uuid}`,
        size: remote.size,
        creationTime: new Date(remote.createdAt).getTime(),
        lastWriteTime: new Date(remote.updatedAt).getTime(),
      });

      logger.debug({
        tag: 'SYNC-ENGINE',
        msg: 'File successfully synced from remote to local',
        path: remote.path,
        newSize: remote.size,
      });
    } catch (error) {
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error syncing remote changes to local',
        path: remote.path,
        error,
      });
    }
  }
}
