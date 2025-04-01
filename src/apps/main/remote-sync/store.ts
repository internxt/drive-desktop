import { DriveFilesCollection } from '../database/collections/DriveFileCollection';
import { DriveFoldersCollection } from '../database/collections/DriveFolderCollection';
import { RemoteSyncManager } from './RemoteSyncManager';

export const remoteSyncManagers = new Map<string, RemoteSyncManager>();
export const driveFilesCollection = new DriveFilesCollection();
export const driveFoldersCollection = new DriveFoldersCollection();

export const FETCH_LIMIT = 50;
