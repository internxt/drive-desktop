import { driveFilesCollection, driveFoldersCollection } from '@/apps/main/remote-sync/store';

export const SQLiteModule = {
  getFile: driveFilesCollection.get,
  getFolder: driveFoldersCollection.get,
};
