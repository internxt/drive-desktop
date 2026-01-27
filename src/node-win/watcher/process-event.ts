import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { onUnlink } from '@/backend/features/local-sync/watcher/events/unlink/on-unlink';
import { stat } from 'node:fs/promises';
import { onAdd } from './events/on-add.service';
import { onAddDir } from './events/on-add-dir.service';
import { debounceOnRaw } from './events/debounce-on-raw';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type Props = {
  ctx: ProcessSyncContext;
  event: 'create' | 'update' | 'delete';
  path: AbsolutePath;
};

export async function processEvent({ ctx, event, path }: Props) {
  try {
    if (event === 'delete') {
      await onUnlink({ ctx, path });
      return;
    }

    const stats = await stat(path);

    if (event === 'update' && stats.isFile()) {
      debounceOnRaw({ ctx, path, stats });
      return;
    }

    if (event === 'create') {
      if (stats.isFile()) {
        await onAdd({ ctx, path, stats });
      } else if (stats.isDirectory()) {
        await onAddDir({ ctx, path });
      }
    }
  } catch (error) {
    ctx.logger.error({ msg: 'Error in watcher event', path, event, error });
  }
}
