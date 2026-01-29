import { SyncContext } from '@/apps/sync-engine/config';
import { WorkerConfig, workers } from '@/apps/main/remote-sync/store';
import { scheduleSync } from './schedule-sync';
import { addRemoteSyncManager } from '@/apps/main/remote-sync/handlers';
import { RecoverySyncModule } from '@/backend/features/sync/recovery-sync/recovery-sync.module';
import { Addon } from '@/node-win/addon-wrapper';
import { addSyncIssue } from '../../issues';
import { refreshItemPlaceholders } from '@/apps/sync-engine/refresh-item-placeholders';
import { addPendingItems } from '@/apps/sync-engine/in/add-pending-items';
import { initWatcher } from '@/node-win/watcher/watcher';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { refreshWorkspaceToken } from '@/apps/sync-engine/refresh-workspace-token';

type TProps = {
  ctx: SyncContext;
};

export async function spawnSyncEngineWorker({ ctx }: TProps) {
  ctx.logger.debug({ msg: 'Spawn sync engine worker' });

  let connectionKey: bigint;

  try {
    try {
      await VirtualDrive.createSyncRootFolder({ rootPath: ctx.rootPath });
      await Addon.registerSyncRoot({ rootPath: ctx.rootPath, providerId: ctx.providerId, providerName: ctx.providerName });
      connectionKey = Addon.connectSyncRoot({ ctx });
      ctx.logger.debug({ msg: 'Connection key', connectionKey });
    } catch (error) {
      addSyncIssue({ error: 'CANNOT_REGISTER_VIRTUAL_DRIVE', name: ctx.rootPath });
      throw error;
    }

    /**
     * Jonathan Arce v2.5.1
     * The goal is to create/update/delete placeholders once the sync engine process spawns,
     * also as we fetch from the backend and after the fetch finish to ensure that all placeholders are right.
     * This one is for the first case, since maybe the sync engine failed in a previous fetching
     * and we have some placeholders pending from being created/updated/deleted
     */
    await refreshItemPlaceholders({ ctx, isFirstExecution: true });

    /**
     * v2.5.7 Daniel Jiménez
     * If the cloud provider was not registered before it means that all items that
     * were in the root folder have their placeholders gone, so we need to refresh first
     * all item placeholders and then execute this function.
     */
    void addPendingItems({ ctx });

    const manager = addRemoteSyncManager({ context: ctx });

    const worker: WorkerConfig = {
      ctx,
      connectionKey,
      syncSchedule: scheduleSync({ ctx, manager }),
      watcher: initWatcher({ ctx }),
      workspaceTokenInterval: refreshWorkspaceToken({ ctx }),
    };

    workers.set(ctx.workspaceId, worker);

    /**
     * v2.5.6 Daniel Jiménez
     * Since we can have a different status in our local database that in remote,
     * we want to run also this sync in background to update the statuses.
     */
    void RecoverySyncModule.recoverySync({ ctx });
  } catch (exc) {
    ctx.logger.error({ msg: 'Error loading sync engine worker', exc });
  }
}
