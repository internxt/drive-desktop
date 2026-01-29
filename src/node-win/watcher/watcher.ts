import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { processEvent } from './process-event';
import { Addon } from '../addon-wrapper';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';

type Props = { ctx: ProcessSyncContext };

export function initWatcher({ ctx }: Props) {
  ctx.logger.debug({ msg: 'Setup watcher' });

  const handle = Addon.watchPath({
    ctx,
    onEvent: ({ action, path, type }) => {
      if (type === 'error') {
        ctx.logger.error({ msg: 'Error in watcher', action, type, error: path });
        return;
      }

      void processEvent({ ctx, event: action, type, path: abs(path) });
    },
  });

  return {
    unsubscribe: () => Addon.unwatchPath({ handle }),
  };
}
