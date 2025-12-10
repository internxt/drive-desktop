import { ipcRendererSyncEngine } from './ipcRendererSyncEngine';
import { ProcessSyncContext } from './config';
import { Callbacks } from '@/node-win/types/callbacks.type';
import { addPendingItems } from './in/add-pending-items';
import { refreshItemPlaceholders } from './refresh-item-placeholders';
import { fetchData } from './callbacks/fetchData.service';
import { createAbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Addon } from '@/node-win/addon-wrapper';

export class BindingsManager {
  static async start({ ctx }: { ctx: ProcessSyncContext }) {
    const callbacks: Callbacks = {
      fetchDataCallback: async (win32Path, callback) => {
        await fetchData({
          ctx,
          path: createAbsolutePath(win32Path),
          callback,
        });
      },
      cancelFetchDataCallback: (win32Path) => {
        const path = createAbsolutePath(win32Path);

        ctx.logger.debug({ msg: 'Cencel fetch data callback', path });

        ctx.contentsDownloader.forceStop({ path });
        ipcRendererSyncEngine.send('FILE_DOWNLOAD_CANCEL', { path });
      },
    };

    try {
      await Addon.registerSyncRoot({ rootPath: ctx.rootPath, providerId: ctx.providerId, providerName: ctx.providerName });
      Addon.connectSyncRoot({ rootPath: ctx.rootPath, callbacks });
    } catch (error) {
      ipcRendererSyncEngine.send('ADD_SYNC_ISSUE', { error: 'CANNOT_REGISTER_VIRTUAL_DRIVE', name: ctx.rootPath });
      throw error;
    }

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
}
