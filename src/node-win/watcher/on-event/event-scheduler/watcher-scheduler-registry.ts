import { SyncContext } from '@/apps/sync-engine/config';
import { createWatcherEventDispatcher } from '../watcher-event-dispatcher';
import { WatcherEventScheduler } from './types';
import { createWatcherEventScheduler } from './watcher-event-scheduler';

/**
 * One scheduler is required for each active Sync context. A personal Drive and
 * Business workspaces can run at the same time, and must not share debounce
 * state, queues, or concurrency limits.
 */
const schedulers = new Map<SyncContext, WatcherEventScheduler>();

export function getWatcherEventScheduler(ctx: SyncContext) {
  const existing = schedulers.get(ctx);
  if (existing) return existing;

  const scheduler = createWatcherEventScheduler({
    dispatch: createWatcherEventDispatcher(ctx),
    onError: (error, event) => ctx.logger.error({ msg: 'Error in watcher event scheduler', event, error }),
  });
  schedulers.set(ctx, scheduler);
  return scheduler;
}

export function disposeWatcherEventScheduler(ctx: SyncContext) {
  // Removing a Map entry does not stop timers or queued work retained by the
  // scheduler, so dispose it before allowing a later watcher to create a new one.
  schedulers.get(ctx)?.dispose();
  schedulers.delete(ctx);
}
