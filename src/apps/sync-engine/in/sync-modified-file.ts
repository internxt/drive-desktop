import { updateContentsId } from '@/apps/sync-engine/callbacks-controllers/controllers/update-contents-id';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { DriveFile } from '@/apps/main/database/entities/DriveFile';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { logger } from '@/apps/shared/logger/logger';
import { Stats } from 'fs';
import { PinState } from '@/node-win/types/placeholder.type';

type Props = {
  remoteFile: DriveFile;
  localFile: { path: AbsolutePath; stats: Stats };
  fileContentsUploader: ContentsUploader;
  virtualDrive: VirtualDrive;
};

export async function syncModifiedFile({ remoteFile, localFile, fileContentsUploader, virtualDrive }: Props) {
  if (localFile.stats.size !== remoteFile.size) {
    const path = pathUtils.absoluteToRelative({ base: virtualDrive.syncRootPath, path: localFile.path });

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

    const { pinState } = virtualDrive.getPlaceholderState({ path });

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
      stats: localFile.stats,
      path,
      absolutePath: localFile.path,
      uuid: remoteFile.uuid,
      fileContentsUploader,
    });
  }
}
