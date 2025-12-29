import { subscribe } from '@parcel/watcher';
import { onAll } from './events/on-all.service';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { processEvent } from './process-event';

type Props = { ctx: ProcessSyncContext };

export async function initWatcher({ ctx }: Props) {
  const subscription = await subscribe(ctx.rootPath, async (error, events) => {
    if (error) {
      ctx.logger.error({ msg: 'Error in watcher', error });
      return;
    }

    await Promise.all(
      events.map(async (event) => {
        onAll({ event });
        await processEvent({ ctx, event });
      }),
    );
  });

  return subscription;
}
