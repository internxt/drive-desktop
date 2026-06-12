import { SyncContext } from '@/apps/sync-engine/config';
import { Watcher } from '@/node-win/addon';

export type WorkerConfig = {
  ctx: SyncContext;
  connectionKey: bigint;
  syncSchedule: NodeJS.Timeout;
  watcher?: Watcher.Subscription;
  workspaceTokenInterval: NodeJS.Timeout | undefined;
};

export const workers = new Map<string, WorkerConfig>();

export const FETCH_LIMIT_1000 = 1000;

export function getSyncContexts(): Array<SyncContext> {
  return Array.from(workers.values()).map((w) => w.ctx);
}
