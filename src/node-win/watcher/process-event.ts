import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { onUnlink } from '@/backend/features/local-sync/watcher/events/unlink/on-unlink';
import { onAdd } from './events/on-add.service';
import { onAddDir } from './events/on-add-dir.service';
import { debounceOnRaw } from './events/debounce-on-raw';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type Props = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  event: 'create' | 'update' | 'delete';
  type: 'file' | 'folder' | 'unknown';
};

export async function processEvent({ ctx, event, type, path }: Props) {
  try {
    if (event === 'delete') {
      await onUnlink({ ctx, path });
      return;
    }

    if (event === 'update' && type === 'file') {
      debounceOnRaw({ ctx, path });
      return;
    }

    if (event === 'create') {
      if (type === 'file') {
        await onAdd({ ctx, path });
      } else if (type === 'folder') {
        await onAddDir({ ctx, path });
      }
    }
  } catch (error) {
    ctx.logger.error({ msg: 'Error in watcher event', path, event, error });
  }
}
