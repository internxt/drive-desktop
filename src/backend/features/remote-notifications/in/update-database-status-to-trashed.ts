import { driveFilesCollection, driveFoldersCollection } from '@/apps/main/remote-sync/store';
import { In } from 'typeorm';

export const updateDatabaseStatusToTrashed = async (
  files: Array<{ type: 'file'; uuid: string }>,
  folders: Array<{ type: 'folder'; uuid: string }>,
) => {
  await Promise.all([
    driveFilesCollection.updateInBatch({
      where: { uuid: In(files.map((file) => file.uuid)) },
      payload: { status: 'TRASHED' },
    }),
    driveFoldersCollection.updateInBatch({
      where: { uuid: In(folders.map((folder) => folder.uuid)) },
      payload: { status: 'TRASHED' },
    }),
  ]);
};
