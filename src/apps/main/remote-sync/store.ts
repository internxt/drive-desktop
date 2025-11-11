import { logger } from '@/apps/shared/logger/logger';
import { RemoteSyncManager } from './RemoteSyncManager';
import { DriveFileCollection } from '@/infra/sqlite/services/drive-file';
import { DriveFolderCollection } from '@/infra/sqlite/services/drive-folder';
import { BrowserWindow } from 'electron';
import { SyncContext } from '@/apps/sync-engine/config';

export type WorkerConfig = {
  ctx: SyncContext;
  browserWindow: BrowserWindow;
  syncSchedule: NodeJS.Timeout;
};

export const workers = new Map<string, WorkerConfig>();
export const remoteSyncManagers = new Map<string, RemoteSyncManager>();
export const driveFilesCollection = new DriveFileCollection();
export const driveFoldersCollection = new DriveFolderCollection();

export const FETCH_LIMIT_50 = 50;
export const FETCH_LIMIT_1000 = 1000;

export function getRemoteSyncManager({ workspaceId }: { workspaceId: string }) {
  const manager = remoteSyncManagers.get(workspaceId);
  if (manager) return manager;
  logger.error({ msg: 'RemoteSyncManager not found', workspaceId });
  return null;
}
