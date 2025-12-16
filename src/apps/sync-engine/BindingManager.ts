import { ipcRendererSyncEngine } from './ipcRendererSyncEngine';
import { ProcessSyncContext } from './config';
import { Callbacks } from '@/node-win/types/callbacks.type';
import { fetchData } from './callbacks/fetchData.service';
import { createAbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Addon } from '@/node-win/addon-wrapper';

export class BindingsManager {
  static start({ ctx }: { ctx: ProcessSyncContext }) {
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

    Addon.connectSyncRoot({ rootPath: ctx.rootPath, callbacks });
  }
}
