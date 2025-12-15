import { RemoteSyncManager } from './RemoteSyncManager';
import { BrowserWindow } from 'electron';
import { SyncContext } from '@/apps/sync-engine/config';
import { FSWatcher } from 'chokidar';

export type WorkerConfig = {
  ctx: SyncContext;
  browserWindow: BrowserWindow;
  syncSchedule: NodeJS.Timeout;
  watcher: FSWatcher;
};

export const workers = new Map<string, WorkerConfig>();
export const remoteSyncManagers = new Map<string, RemoteSyncManager>();

export const FETCH_LIMIT_1000 = 1000;
