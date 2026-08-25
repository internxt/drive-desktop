import { SyncContext } from '@/apps/sync-engine/config';
import { Addon } from '../addon-wrapper';
import { disposeOnEventScheduler, onEvent } from './on-event/on-event';

export function initWatcher({ ctx }: { ctx: SyncContext }) {
  ctx.logger.debug({ msg: 'Setup watcher' });

  const handle = Addon.watchPath({
    rootPath: ctx.rootPath,
    /**
     * Alexis Mora
     * v2.6.13
     * The addon has already grouped native notifications.
     * Keep this callback deliberately small: the scheduler owns debounce/coalescing and bounded processing
     * while this boundary avoids one N-API callback per item
     */
    onEvents: (events) => events.forEach((event) => onEvent({ ctx, event })),
  });

  return {
    unsubscribe: () => {
      disposeOnEventScheduler(ctx);
      Addon.unwatchPath({ handle });
    },
  };
}
