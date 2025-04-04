import { logger } from '@/apps/shared/logger/logger';
import { DriveFilesCollection } from '../database/collections/DriveFileCollection';
import { DriveFoldersCollection } from '../database/collections/DriveFolderCollection';
import { RemoteSyncManager } from './RemoteSyncManager';

export const remoteSyncManagers = new Map<string, RemoteSyncManager>();
export const driveFilesCollection = new DriveFilesCollection();
export const driveFoldersCollection = new DriveFoldersCollection();

export const FETCH_LIMIT = 50;

export function getRemoteSyncManager({ workspaceId }: { workspaceId: string }) {
  const manager = remoteSyncManagers.get(workspaceId);
  if (manager) return manager;
  logger.error({ msg: 'RemoteSyncManager not found', workspaceId });
  return null;
}
