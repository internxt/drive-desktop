import { BindingsManager, CallbackDownload } from '../BindingManager';
import { FilePlaceholderId } from '../../../context/virtual-drive/files/domain/PlaceholderId';
import * as fs from 'fs';
import { dirname } from 'path';
import { ipcRendererSyncEngine } from '../ipcRendererSyncEngine';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { logger } from '@/apps/shared/logger/logger';

type TProps = {
  self: BindingsManager;
  filePlaceholderId: FilePlaceholderId;
  callback: CallbackDownload;
};

export class FetchDataService {
  async run({ self, filePlaceholderId, callback }: TProps) {
    try {
      logger.debug({ msg: '[Fetch Data Callback] Donwloading begins' });

      const path = await self.controllers.downloadFile.execute(filePlaceholderId, callback);

      const uuid = NodeWin.getFileUuidFromPlaceholder({ placeholderId: filePlaceholderId });
      const file = await self.controllers.downloadFile.fileFinderByUuid({ uuid });

      logger.debug({ msg: '[Fetch Data Callback] Preparing begins', path });

      try {
        let finished = false;

        while (!finished) {
          const result = await callback(true, path);
          finished = result.finished;

          logger.debug({ msg: 'Callback result', result });

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
        logger.error({ msg: '[Fetch Data Error]', path, error });
        // await callback(false, '');
        fs.unlinkSync(path);
        return;
      }

      fs.unlinkSync(path);

      logger.debug({ msg: '[Fetch Data Callback] Finish', path });
    } catch (error) {
      logger.error({ msg: '[Fetch Data Error]', error });
      await callback(false, '');
    }
  }

  normalizePath(path: string) {
    return dirname(path).replace(/\\/g, '/');
  }
}
