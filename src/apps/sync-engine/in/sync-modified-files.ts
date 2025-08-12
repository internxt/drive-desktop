import { loadInMemoryPaths } from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { syncModifiedFile } from './sync-modified-file';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { Tree } from '@/context/virtual-drive/items/application/Traverser';

type SyncModifiedFilesProps = {
  fileContentsUploader: ContentsUploader;
  virtualDrive: VirtualDrive;
  tree: Tree;
};

export async function syncModifiedFiles({ fileContentsUploader, virtualDrive, tree }: SyncModifiedFilesProps) {
  const { files } = await loadInMemoryPaths();

  const promises = tree.files.map(async (remoteDriveFile) => {
    const localFile = files[remoteDriveFile.uuid as FileUuid];
    if (!localFile) return;

    await syncModifiedFile({ remoteFile: remoteDriveFile, localFile, fileContentsUploader, virtualDrive });
  });
  await Promise.all(promises);
}
