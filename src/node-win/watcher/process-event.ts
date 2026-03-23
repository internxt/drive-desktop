import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { onAddDir } from './events/on-add-dir.service';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { onUnlink } from '@/backend/features/local-sync/watcher/events/unlink/on-unlink';
import { Watcher } from '../addon';
import { onChange } from './events/on-change';

type Props = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  event: Watcher.SuccessEvent;
};

// We receive a delete event when:
// - delete a file or a folder.

// We receive a create event when:
// - create an empty file.
// - create a folder.
// - move a file or a folder.

// We receive an update event when:
// - create a file with content.
// - hydrate or dehydrate file or folder.
// - modify a file (we may lose the placeholderId). We can recreate this use case by editing
// an image with Paint.

// We receive a rename_new event when:
// - rename a file or a folder.
// - modify a file (we may lose the placeholderId).

export async function processEvent({ ctx, event, path }: Props) {
  try {
    if (event.action === 'delete') {
      await onUnlink({ ctx, path, type: event.type });
      return;
    }

    if (event.type === 'file' && event.action !== 'rename_old') {
      await onChange({ ctx, event, path });
      return;
    }

    if (event.type === 'folder') {
      if (event.action === 'create' || event.action === 'rename_new') {
        await onAddDir({ ctx, path });
      }
    }
  } catch (error) {
    ctx.logger.error({ msg: 'Error in watcher event', path, event, error });
  }
}
