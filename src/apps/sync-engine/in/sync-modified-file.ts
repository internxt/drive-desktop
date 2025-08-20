import { updateContentsId } from '@/apps/sync-engine/callbacks-controllers/controllers/update-contents-id';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { DriveFile } from '@/apps/main/database/entities/DriveFile';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { logger } from '@/apps/shared/logger/logger';
import { Stats } from 'fs';

type Props = {
  remoteFile: DriveFile;
  localFile: { path: AbsolutePath; stats: Stats };
  fileContentsUploader: ContentsUploader;
  virtualDrive: VirtualDrive;
};

export async function syncModifiedFile({ remoteFile, localFile, fileContentsUploader, virtualDrive }: Props) {
  if (localFile.stats.size !== remoteFile.size) {
    const fileRelativePath = pathUtils.absoluteToRelative({ base: virtualDrive.syncRootPath, path: localFile.path });
    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'File placeholder has been modified locally, updating remote',
      path: fileRelativePath,
      uuid: remoteFile.uuid,
      remoteDate: remoteFile.modificationTime,
      localDate: localFile.stats.mtime.toISOString(),
    });

    await updateContentsId({
      virtualDrive,
      stats: localFile.stats,
      path: fileRelativePath,
      uuid: remoteFile.uuid,
      fileContentsUploader,
    });
  }
}
