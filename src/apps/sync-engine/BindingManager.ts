import { ipcRendererSyncEngine } from './ipcRendererSyncEngine';
import { ProcessSyncContext } from './config';
import { logger } from '../shared/logger/logger';
import { Callbacks } from '@/node-win/types/callbacks.type';
import { createWatcher } from './create-watcher';
import { addPendingItems } from './in/add-pending-items';
import { refreshItemPlaceholders } from './refresh-item-placeholders';
import { fetchData } from './callbacks/fetchData.service';
import { ProcessContainer } from './build-process-container';

export class BindingsManager {
  static async start({ ctx, container }: { ctx: ProcessSyncContext; container: ProcessContainer }) {
    const callbacks: Callbacks = {
      fetchDataCallback: async (placeholderId, callback) => {
        await fetchData({
          container,
          placeholderId,
          callback,
        });
      },
      cancelFetchDataCallback: () => {
        logger.debug({ msg: 'cancelFetchDataCallback' });
        container.downloadFile.cancel();
      },
    };

    this.stop({ ctx });

    ctx.virtualDrive.registerSyncRoot({ providerName: ctx.providerName });
    ctx.virtualDrive.connectSyncRoot({ callbacks });

    /**
     * Jonathan Arce v2.5.1
     * The goal is to create/update/delete placeholders once the sync engine process spawns,
     * also as we fetch from the backend and after the fetch finish to ensure that all placeholders are right.
     * This one is for the first case, since maybe the sync engine failed in a previous fetching
     * and we have some placeholders pending from being created/updated/deleted
     */
    await refreshItemPlaceholders({ ctx });

    /**
     * v2.5.7 Daniel Jiménez
     * If the cloud provider was not registered before it means that all items that
     * were in the root folder have their placeholders gone, so we need to refresh first
     * all item placeholders and then execute this function.
     */
    void addPendingItems({ ctx });
  }

  static watch({ ctx }: { ctx: ProcessSyncContext }) {
    const { watcher } = createWatcher({ ctx });

    watcher.watchAndWait({ ctx });
  }

  static stop({ ctx }: { ctx: ProcessSyncContext }) {
    ctx.virtualDrive.disconnectSyncRoot();
  }

  static async updateAndCheckPlaceholders({ ctx }: { ctx: ProcessSyncContext }): Promise<void> {
    const workspaceId = ctx.workspaceId;

    try {
      await refreshItemPlaceholders({ ctx });
      ipcRendererSyncEngine.send('CHANGE_SYNC_STATUS', workspaceId, 'SYNCED');
    } catch (exc) {
      logger.error({ tag: 'SYNC-ENGINE', msg: 'Error updating and checking placeholder', workspaceId, exc });
      ipcRendererSyncEngine.send('CHANGE_SYNC_STATUS', workspaceId, 'SYNC_FAILED');
    }
  }
}
