import { Watcher } from '@/node-win/addon';
import { RemoteSyncManager } from './RemoteSyncManager';
import { SyncContext } from '@/apps/sync-engine/config';

export type WorkerConfig = {
  ctx: SyncContext;
  connectionKey: bigint;
  syncSchedule: NodeJS.Timeout;
  watcher: Watcher.Subscription;
  workspaceTokenInterval: NodeJS.Timeout | undefined;
};

export const workers = new Map<string, WorkerConfig>();
export const remoteSyncManagers = new Map<string, RemoteSyncManager>();

export const FETCH_LIMIT_1000 = 1000;
