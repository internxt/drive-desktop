import { SyncContext } from '@/apps/sync-engine/config';
import { processEvent } from './process-event';
import { Addon } from '../addon-wrapper';
import { abs, dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Watcher } from '../addon';
import { existsSync } from 'node:fs';

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

const events = new Map<number, { event: Watcher.SuccessEvent; timer: NodeJS.Timeout }>();
const DEBOUNCE_MS = process.env.NODE_ENV === 'test' ? 50 : 2000;

function onEvent({ ctx, event }: { ctx: SyncContext; event: Watcher.Event }) {
  if (event.type === 'error') {
    ctx.logger.error({ msg: 'Error in watcher', event });
    return;
  }

  ctx.logger.debug({ msg: 'Watcher event', event });

  // We want to debounce events so if we receive multiple events from the same file
  // we just process the last one and ignore the rest.
  const existing = events.get(event.internalId);
  if (existing) clearTimeout(existing.timer);

  const timer = setTimeout(() => {
    events.delete(event.internalId);
    const path = abs(event.path);

    if (event.action === 'delete') {
      // If the file still exists it means that the file has not been deleted but edited
      // using an atomic operation and we have received a delete event and another one
      // (update or rename_new) with different `internalId`.
      if (existsSync(path)) return;

      // Here we have two possibilities:
      // - if the parent exists it means that we have to mark this item as TRASHED because it's the
      // root of the delete event.
      // - if the parent doesn't exist it means that this item has been deleted because it's inside
      // of a folder that has been deleted, so we need to find that folder to mark it as TRASHED and
      // ignore this item.
      const exists = existsSync(dirname(path));
      if (!exists) return;
    }

    void processEvent({ ctx, event, path });
  }, DEBOUNCE_MS);

  events.set(event.internalId, { event, timer });
}
