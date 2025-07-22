import Logger from 'electron-log';
import { BindingsManager, CallbackDownload } from '../BindingManager';
import { FilePlaceholderId } from '../../../context/virtual-drive/files/domain/PlaceholderId';
import * as fs from 'fs';
import { dirname } from 'path';
import { ipcRendererSyncEngine } from '../ipcRendererSyncEngine';
import { NodeWin } from '@/infra/node-win/node-win.module';

type TProps = {
  self: BindingsManager;
  filePlaceholderId: FilePlaceholderId;
  callback: CallbackDownload;
};

export class FetchDataService {
  async run({ self, filePlaceholderId, callback }: TProps) {
    try {
      Logger.debug('[Fetch Data Callback] Donwloading begins');

      const path = await self.controllers.downloadFile.execute(filePlaceholderId, callback);

      const uuid = NodeWin.getFileUuidFromPlaceholder({ placeholderId: filePlaceholderId });
      const file = await self.controllers.downloadFile.fileFinderByUuid({ uuid });

      Logger.debug('[Fetch Data Callback] Preparing begins', path);

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
            nameWithExtension: file.nameWithExtension,
            progress: result.progress,
          });
        }

        self.progressBuffer = 0;

        ipcRendererSyncEngine.send('FILE_DOWNLOADED', {
          nameWithExtension: file.nameWithExtension,
        });
      } catch (error) {
        Logger.error('[Fetch Data Error]', error);
        Logger.debug('[Fetch Data Error] Finish', path);
        // await callback(false, '');
        fs.unlinkSync(path);
        return;
      }

      fs.unlinkSync(path);

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
