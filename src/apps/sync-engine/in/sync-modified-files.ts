import { loadInMemoryPaths } from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { syncModifiedFile } from './sync-modified-file';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { getExistingFiles } from '@/context/virtual-drive/items/application/RemoteItemsGenerator';

type Props = {
  fileContentsUploader: ContentsUploader;
  virtualDrive: VirtualDrive;
};

export async function syncModifiedFiles({ fileContentsUploader, virtualDrive }: Props) {
  const remoteDriveFiles = await getExistingFiles();
  const { files } = await loadInMemoryPaths();

  const promises = remoteDriveFiles.map(async (remoteDriveFile) => {
    const localFile = files[remoteDriveFile.uuid as FileUuid];
    if (!localFile) return;

    await syncModifiedFile({ remoteFile: remoteDriveFile, localFile, fileContentsUploader, virtualDrive });
  });
  await Promise.all(promises);
}
