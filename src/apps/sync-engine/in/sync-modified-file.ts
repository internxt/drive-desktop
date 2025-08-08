import { loadInMemoryPaths } from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { updateContentsId } from '@/apps/sync-engine/callbacks-controllers/controllers/update-contents-id';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';
import { createRelativePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { getExistingFiles } from '@/context/virtual-drive/items/application/remote-items-generator';
import { DriveFile, FileUuid } from '@/apps/main/database/entities/DriveFile';
import { fileDecryptName } from '@/context/virtual-drive/files/domain/file-decrypt-name';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { logger } from '@/apps/shared/logger/logger';
import { Stats } from 'fs';

type Props = {
  remoteFile: DriveFile;
  localFile: { path: string; stats: Stats };
  remotePath: RelativePath;
  fileContentsUploader: ContentsUploader;
  virtualDrive: VirtualDrive;
};

export async function syncModifiedFile({ remoteFile, localFile, remotePath, fileContentsUploader, virtualDrive }: Props) {
  /**
   * v2.5.6 Esteban Galvis
   * Sync issues occurred due to millisecond differences in modification time,
   * causing repeated updates. To fix this, we round timestamps to seconds.
   */
  const remoteDate = new Date(remoteFile.modificationTime);
  const roundRemoteTime = Math.floor(remoteDate.getTime() / 1000);
  const roundLocalTime = Math.floor(localFile.stats.mtime.getTime() / 1000);

  if (roundLocalTime > roundRemoteTime) {
    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'File placeholder has been modified locally, updating remote',
      path: remotePath,
      uuid: remoteFile.uuid,
      remoteDate: remoteDate.toISOString(),
      localDate: localFile.stats.mtime.toISOString(),
    });

    await updateContentsId({
      virtualDrive,
      stats: localFile.stats,
      path: remotePath,
      uuid: remoteFile.uuid as string,
      fileContentsUploader,
    });
  }
}

type SyncModifiedFilesProps = {
  fileContentsUploader: ContentsUploader;
  virtualDrive: VirtualDrive;
};

export async function syncModifiedFiles({ fileContentsUploader, virtualDrive }: SyncModifiedFilesProps) {
  const remoteDriveFiles = await getExistingFiles();
  const { files } = await loadInMemoryPaths({ drive: virtualDrive });

  remoteDriveFiles.forEach(async (remoteDriveFile) => {
    const localFile = files[remoteDriveFile.uuid as FileUuid];
    if (!localFile) return;

    const { nameWithExtension } = fileDecryptName({
      plainName: remoteDriveFile.plainName,
      encryptedName: remoteDriveFile.name,
      parentId: remoteDriveFile.folderId,
      extension: remoteDriveFile.type,
    });
    const relativePath = createRelativePath('/', nameWithExtension);

    await syncModifiedFile({ remoteFile: remoteDriveFile, localFile, remotePath: relativePath, fileContentsUploader, virtualDrive });
  });
}
