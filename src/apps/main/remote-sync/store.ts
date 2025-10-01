import { logger } from '@/apps/shared/logger/logger';
import { RemoteSyncManager } from './RemoteSyncManager';
import { DriveFileCollection } from '@/infra/sqlite/services/drive-file';
import { DriveFolderCollection } from '@/infra/sqlite/services/drive-folder';

export const remoteSyncManagers = new Map<string, RemoteSyncManager>();
export const driveFilesCollection = new DriveFileCollection();
export const driveFoldersCollection = new DriveFolderCollection();

export const FETCH_LIMIT = 1000;

export function getRemoteSyncManager({ workspaceId }: { workspaceId: string }) {
  const manager = remoteSyncManagers.get(workspaceId);
  if (manager) return manager;
  logger.error({ msg: 'RemoteSyncManager not found', workspaceId });
  return null;
}
