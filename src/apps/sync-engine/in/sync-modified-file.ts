import { updateContentsId } from '@/apps/sync-engine/callbacks-controllers/controllers/update-contents-id';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { DriveFile } from '@/apps/main/database/entities/DriveFile';
import { logger } from '@/apps/shared/logger/logger';
import { Stats } from 'fs';
import { PinState } from '@/node-win/types/placeholder.type';
import { ProcessSyncContext } from '../config';

type Props = {
  ctx: ProcessSyncContext;
  remoteFile: DriveFile;
  localFile: { absolutePath: AbsolutePath; stats: Stats };
};

export async function syncModifiedFile({ ctx, remoteFile, localFile }: Props) {
  if (localFile.stats.size !== remoteFile.size) {
    const path = pathUtils.absoluteToRelative({ base: ctx.virtualDrive.syncRootPath, path: localFile.absolutePath });

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'File has been modified',
      path,
      localSize: localFile.stats.size,
      remoteSize: remoteFile.size,
    });

    const remoteDate = new Date(remoteFile.updatedAt);

    if (remoteDate > localFile.stats.mtime) {
      logger.debug({
        tag: 'SYNC-ENGINE',
        msg: 'Remote file is newer, skipping',
        path,
        remoteDate,
        localDate: localFile.stats.mtime,
      });
      return;
    }

    const { pinState } = ctx.virtualDrive.getPlaceholderState({ path });

    if (pinState !== PinState.AlwaysLocal) {
      logger.debug({
        tag: 'SYNC-ENGINE',
        msg: 'Cannot update file contents id, not hydrated',
        path,
        pinState,
      });
      return;
    }

    await updateContentsId({
      ctx,
      stats: localFile.stats,
      path,
      absolutePath: localFile.absolutePath,
      uuid: remoteFile.uuid,
    });
  }
}
