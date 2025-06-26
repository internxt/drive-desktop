import Logger from 'electron-log';
import { BindingsManager, CallbackDownload } from '../BindingManager';
import { FilePlaceholderId } from '../../../context/virtual-drive/files/domain/PlaceholderId';
import * as fs from 'fs';
import { SyncEngineIpc } from '../ipcRendererSyncEngine';
import { dirname } from 'path';
import { trimPlaceholderId } from '../callbacks-controllers/controllers/placeholder-id';

type TProps = {
  self: BindingsManager;
  filePlaceholderId: FilePlaceholderId;
  callback: CallbackDownload;
  ipcRendererSyncEngine: SyncEngineIpc;
};

export class FetchDataService {
  async run({ self, filePlaceholderId, callback, ipcRendererSyncEngine }: TProps) {
    try {
      Logger.debug('[Fetch Data Callback] Donwloading begins');

      const startTime = Date.now();
      const path = await self.controllers.downloadFile.execute(filePlaceholderId, callback);

      const trimmedPlaceholderId = trimPlaceholderId({ placeholderId: filePlaceholderId });
      const parsedPlaceholderId = trimmedPlaceholderId.split(':')[1];
      const file = self.controllers.downloadFile.fileFinderByUuid({ uuid: parsedPlaceholderId });

      Logger.debug('[Fetch Data Callback] Preparing begins', path);
      Logger.debug('[Fetch Data Callback] Preparing begins', file.path);

      self.lastHydrated = file.path;

      try {
        let finished = false;

        while (!finished) {
          const result = await callback(true, path);
          finished = result.finished;

          Logger.debug('Callback result', result);

          if (result.progress > 1 || result.progress < 0) {
            throw new Error('Result progress is not between 0 and 1');
          } else if (finished && result.progress === 0) {
            throw new Error('Result progress is 0');
          } else if (self.progressBuffer == result.progress) {
            break;
          } else {
            self.progressBuffer = result.progress;
          }

          ipcRendererSyncEngine.send('FILE_DOWNLOADING', {
            name: file.name,
            extension: file.type,
            nameWithExtension: file.nameWithExtension,
            size: file.size,
            processInfo: {
              elapsedTime: 0,
              progress: result.progress,
            },
          });
        }

        self.progressBuffer = 0;

        const finishTime = Date.now();

        ipcRendererSyncEngine.send('FILE_DOWNLOADED', {
          name: file.name,
          extension: file.type,
          nameWithExtension: file.nameWithExtension,
          size: file.size,
          processInfo: { elapsedTime: finishTime - startTime },
        });
      } catch (error) {
        Logger.error('[Fetch Data Error]', error);
        Logger.debug('[Fetch Data Error] Finish', path);
        // await callback(false, '');
        fs.unlinkSync(path);
        return;
      }

      fs.unlinkSync(path);

      self.container.fileSyncStatusUpdater.run(file);

      Logger.debug('[Fetch Data Callback] Finish', path);
    } catch (error) {
      Logger.error(error);
      await callback(false, '');
    }
  }

  normalizePath(path: string) {
    return dirname(path).replace(/\\/g, '/');
  }
}
