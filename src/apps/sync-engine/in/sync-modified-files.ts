import { loadInMemoryPaths } from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { syncModifiedFile } from './sync-modified-file';
import { getExistingFiles } from '@/context/virtual-drive/items/application/RemoteItemsGenerator';
import { ProcessSyncContext } from '../config';

type Props = {
  ctx: ProcessSyncContext;
};

export async function syncModifiedFiles({ ctx }: Props) {
  const remoteDriveFiles = await getExistingFiles();
  const { files } = await loadInMemoryPaths({ ctx });

  const promises = remoteDriveFiles.map(async (remoteDriveFile) => {
    const localFile = files[remoteDriveFile.uuid as FileUuid];
    if (!localFile) return;

    await syncModifiedFile({ ctx, remoteFile: remoteDriveFile, localFile });
  });

  await Promise.all(promises);
}
