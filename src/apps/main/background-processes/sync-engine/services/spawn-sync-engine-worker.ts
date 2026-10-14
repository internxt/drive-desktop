import { WorkerConfig, workers } from '@/apps/main/remote-sync/store';
import { SyncContext } from '@/apps/sync-engine/config';
import { addPendingItems } from '@/apps/sync-engine/in/add-pending-items';
import { refreshItemPlaceholders } from '@/apps/sync-engine/refresh-item-placeholders';
import { refreshWorkspaceToken } from '@/apps/sync-engine/refresh-workspace-token';
import { initWatcher } from '@/node-win/watcher/watcher';
import { loadVirtualDrive } from './load-virtual-drive';
import { scheduleSync } from './schedule-sync';

type TProps = {
  ctx: SyncContext;
};

export async function spawnSyncEngineWorker({ ctx }: TProps) {
  ctx.logger.debug({ msg: 'Spawn sync engine worker', rootUuid: ctx.rootUuid });

  try {
    const connectionKey = await loadVirtualDrive({ ctx });
    if (!connectionKey) return;

    const worker: WorkerConfig = {
      ctx,
      connectionKey,
      syncSchedule: scheduleSync({ ctx }),
      workspaceTokenInterval: refreshWorkspaceToken({ ctx }),
    };

    workers.set(ctx.workspaceId, worker);

    /**
     * Jonathan Arce v2.5.1
     * The goal is to create/update/delete placeholders once the sync engine process spawns,
     * also as we fetch from the backend and after the fetch finish to ensure that all placeholders are right.
     * This one is for the first case, since maybe the sync engine failed in a previous fetching
     * and we have some placeholders pending from being created/updated/deleted
     */
    await refreshItemPlaceholders({ ctx, isFirstExecution: true });

    worker.watcher = initWatcher({ ctx });

    /**
     * v2.5.7 Daniel Jiménez
     * If the cloud provider was not registered before it means that all items that
     * were in the root folder have their placeholders gone, so we need to refresh first
     * all item placeholders and then execute this function.
     */
    void addPendingItems({ ctx });

  } catch (exc) {
    ctx.logger.error({ msg: 'Error loading sync engine worker', exc });
  }
}
