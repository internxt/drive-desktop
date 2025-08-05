import { BindingsManager, CallbackDownload } from '../BindingManager';
import { FilePlaceholderId } from '../../../context/virtual-drive/files/domain/PlaceholderId';
import { dirname } from 'path';
import { ipcRendererSyncEngine } from '../ipcRendererSyncEngine';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { logger } from '@/apps/shared/logger/logger';
import { unlink } from 'fs/promises';

type TProps = {
  self: BindingsManager;
  filePlaceholderId: FilePlaceholderId;
  callback: CallbackDownload;
};

export class FetchDataService {
  async run({ self, filePlaceholderId, callback }: TProps) {
    try {
      logger.debug({ msg: '[Fetch Data Callback] Donwloading begins' });

      const tmpPath = await self.controllers.downloadFile.execute(filePlaceholderId, callback);

      const uuid = NodeWin.getFileUuidFromPlaceholder({ placeholderId: filePlaceholderId });
      const file = await self.controllers.downloadFile.fileFinderByUuid({ uuid });

      logger.debug({ msg: '[Fetch Data Callback] Preparing begins', tmpPath });

      try {
        let finished = false;

        while (!finished) {
          const result = await callback(true, tmpPath);
          finished = result.finished;

          logger.debug({ msg: 'Callback result', tmpPath, result });

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
            key: uuid,
            nameWithExtension: file.nameWithExtension,
            progress: result.progress,
          });
        }

        self.progressBuffer = 0;

        ipcRendererSyncEngine.send('FILE_DOWNLOADED', {
          key: uuid,
          nameWithExtension: file.nameWithExtension,
        });
      } catch (error) {
        logger.error({ msg: '[Fetch Data Callback] Error', tmpPath, error });
        // await callback(false, '');
        await unlink(tmpPath);
        return;
      }

      await unlink(tmpPath);

      logger.debug({ msg: '[Fetch Data Callback] Finish', tmpPath });
    } catch (error) {
      logger.error({ msg: '[Fetch Data Error]', error });
      await callback(false, '');
    }
  }

  normalizePath(tmpPath: string) {
    return dirname(tmpPath).replace(/\\/g, '/');
  }
}
