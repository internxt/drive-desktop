import { SyncContext } from '@/apps/sync-engine/config';
import { Addon } from '../addon-wrapper';
import { onEvent } from './on-event';

export function initWatcher({ ctx }: { ctx: SyncContext }) {
  ctx.logger.debug({ msg: 'Setup watcher' });

  const handle = Addon.watchPath({
    rootPath: ctx.rootPath,
    onEvent: (event) => onEvent({ ctx, event }),
  });

  return {
    unsubscribe: () => Addon.unwatchPath({ handle }),
  };
}
