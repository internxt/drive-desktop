import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { SyncContext } from '@/apps/sync-engine/config';
import { dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { access } from '@/infra/file-system/services/access';
import { Watcher } from '../../addon';
import { processEvent } from '../process-event';

/** Creates the Sync-specific work that a generic watcher scheduler executes. */
export function createWatcherEventDispatcher(ctx: SyncContext) {
  return async (event: Watcher.SuccessEvent) => {
    if (!(await shouldProcess(event))) return;
    await processEvent({ ctx, event, path: event.path });
  };
}

/**
 * A watcher notification alone is not enough evidence to delete remotely.
 * UNKNOWN filesystem-access errors are not considered a confirmed deletion.
 */
async function isPathConfirmedDeleted(path: string): Promise<boolean> {
  const error = await access(path);
  return error?.code === 'NON_EXISTS';
}

/**
 * Windows reports deletes for every child of a recursively deleted folder.
 * Only the highest deleted item whose parent still exists should reach Sync;
 * that parent deletion accounts for its descendants.
 */
async function parentStillExists(path: AbsolutePath): Promise<boolean> {
  return (await access(dirname(path))) === undefined;
}

/**
 * Ignores a stale delete from an atomic replacement and a child delete already covered by its removed parent folder.
 * Filesystem access is asynchronous so this check cannot block Electron main process.
 * Sync work remains idempotent because the result is only a snapshot.
 */
async function shouldProcess(event: Watcher.SuccessEvent): Promise<boolean> {
  if (event.action !== 'delete') return true;
  return (await isPathConfirmedDeleted(event.path)) && (await parentStillExists(event.path));
}
