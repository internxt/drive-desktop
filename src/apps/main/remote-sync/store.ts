import { DriveFilesCollection } from '../database/collections/DriveFileCollection';
import { DriveFoldersCollection } from '../database/collections/DriveFolderCollection';
import { RemoteSyncStatus } from './helpers';

export type TStore = {
  totalFilesSynced: number;
  totalFilesUnsynced: string[];
  totalFoldersSynced: number;
  status: RemoteSyncStatus;
  filesSyncStatus: RemoteSyncStatus;
  foldersSyncStatus: RemoteSyncStatus;
  placeholdersStatus: RemoteSyncStatus;
  lastSyncingFinishedTimestamp: Date | null;
};

export const driveFilesCollection = new DriveFilesCollection();
export const driveFoldersCollection = new DriveFoldersCollection();
export const stores = new Map<string, TStore>();
export const FETCH_FILES_LIMIT_PER_REQUEST = 50;
export const FETCH_FOLDERS_LIMIT_PER_REQUEST = 50;

export function getEmptyStore(): TStore {
  return {
    totalFilesSynced: 0,
    totalFilesUnsynced: [],
    totalFoldersSynced: 0,
    status: 'IDLE',
    filesSyncStatus: 'IDLE',
    foldersSyncStatus: 'IDLE',
    placeholdersStatus: 'IDLE',
    lastSyncingFinishedTimestamp: null,
  };
}
