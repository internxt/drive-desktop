import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { onUnlink } from '@/backend/features/local-sync/watcher/events/unlink/on-unlink';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import ParcelWatcher from '@parcel/watcher';
import { stat } from 'node:fs/promises';
import { onAdd } from './events/on-add.service';
import { onAddDir } from './events/on-add-dir.service';
// import { debounceOnRaw } from './events/debounce-on-raw';

type Props = {
  ctx: ProcessSyncContext;
  event: ParcelWatcher.Event;
};

export async function processEvent({ ctx, event }: Props) {
  try {
    const path = abs(event.path);

    if (event.type === 'delete') {
      await onUnlink({ ctx, path });
      return;
    }

    const stats = await stat(path);

    if (event.type === 'update') {
      // if (stats.isFile()) debounceOnRaw({ ctx, path, stats });
      return;
    }

    if (stats.isFile()) {
      await onAdd({ ctx, path, stats });
    } else if (stats.isDirectory()) {
      await onAddDir({ ctx, path });
    }
  } catch (error) {
    ctx.logger.error({ msg: 'Error in watcher event', event, error });
  }
}
