import { SyncContext } from '@/apps/sync-engine/config';
import { Watcher } from '../../addon';
import { disposeWatcherEventScheduler, getWatcherEventScheduler } from './event-scheduler/watcher-scheduler-registry';

export function onEvent({ ctx, event }: { ctx: SyncContext; event: Watcher.Event }) {
  if (event.action === 'error') {
    ctx.logger.error({ msg: 'Error in watcher', event });
    return;
  }

  getWatcherEventScheduler(ctx).add(event);
}

export function disposeOnEventScheduler(ctx: SyncContext) {
  disposeWatcherEventScheduler(ctx);
}
