import { BindingsManager, CallbackDownload } from '../BindingManager';
import { FilePlaceholderId } from '../../../context/virtual-drive/files/domain/PlaceholderId';
import { basename } from 'path';
import { ipcRendererSyncEngine } from '../ipcRendererSyncEngine';
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
      const startTime = Date.now();
      const path = await self.controllers.downloadFile.execute(filePlaceholderId, callback);
      const nameWithExtension = basename(path);

      logger.debug({
        tag: 'SYNC-ENGINE',
        msg: 'Start fetching data',
        path,
        filePlaceholderId,
      });

      let progressBuffer = 0;
      let finished = false;

      try {
        while (!finished) {
          const result = await callback(true, path);
          finished = result.finished;

          logger.debug({
            tag: 'SYNC-ENGINE',
            msg: 'Callback result',
            path,
            result,
          });

          if (result.progress > 1 || result.progress < 0) {
            throw logger.error({
              tag: 'SYNC-ENGINE',
              msg: 'Result progress is not between 0 and 1',
              path,
              progress: result.progress,
            });
          } else if (finished && result.progress === 0) {
            throw logger.error({
              tag: 'SYNC-ENGINE',
              msg: 'Result progress is 0',
              path,
            });
          } else if (progressBuffer == result.progress) {
            break;
          } else {
            progressBuffer = result.progress;
          }

          ipcRendererSyncEngine.send('FILE_DOWNLOADING', {
            nameWithExtension,
            processInfo: {
              elapsedTime: 0,
              progress: result.progress,
            },
          });
        }

        const finishTime = Date.now();

        ipcRendererSyncEngine.send('FILE_DOWNLOADED', {
          nameWithExtension,
          processInfo: { elapsedTime: finishTime - startTime },
        });

        logger.debug({
          tag: 'SYNC-ENGINE',
          msg: 'Finish fetching data',
          path,
        });
      } catch (error) {
        logger.error({
          tag: 'SYNC-ENGINE',
          msg: 'Error fetching data',
          path,
          error,
        });
        // await callback(false, '');
      }

      await unlink(path);
    } catch (error) {
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error fetching data',
        filePlaceholderId,
        error,
      });
      await callback(false, '');
    }
  }
}
