import { FilePlaceholderId } from '../../../context/virtual-drive/files/domain/PlaceholderId';
import { ipcRendererSyncEngine } from '../ipcRendererSyncEngine';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { logger } from '@/apps/shared/logger/logger';
import { unlink } from 'node:fs/promises';
import { CallbackDownload } from '@/node-win/types/callbacks.type';
import { ProcessContainer } from '../build-process-container';

type TProps = {
  container: ProcessContainer;
  filePlaceholderId: FilePlaceholderId;
  callback: CallbackDownload;
};

export async function fetchData({ container, filePlaceholderId, callback }: TProps) {
  try {
    logger.debug({ msg: '[Fetch Data Callback] Donwloading begins' });

    const tmpPath = await container.downloadFile.execute(filePlaceholderId, callback);

    const uuid = NodeWin.getFileUuidFromPlaceholder({ placeholderId: filePlaceholderId });
    const file = await container.downloadFile.fileFinderByUuid({ uuid });

    logger.debug({ msg: '[Fetch Data Callback] Preparing begins', tmpPath });

    let finished = false;
    let progressBuffer = 0;

    try {
      while (!finished) {
        const result = await callback(true, tmpPath);
        finished = result.finished;

        logger.debug({ msg: 'Callback result', tmpPath, result });

        if (result.progress > 1 || result.progress < 0) {
          throw new Error('Result progress is not between 0 and 1');
        } else if (finished && result.progress === 0) {
          throw new Error('Result progress is 0');
        } else if (progressBuffer == result.progress) {
          break;
        } else {
          progressBuffer = result.progress;
        }

        ipcRendererSyncEngine.send('FILE_DOWNLOADING', {
          key: uuid,
          nameWithExtension: file.nameWithExtension,
          progress: result.progress,
        });
      }

      ipcRendererSyncEngine.send('FILE_DOWNLOADED', {
        key: uuid,
        nameWithExtension: file.nameWithExtension,
      });

      logger.debug({ msg: '[Fetch Data Callback] Finish', tmpPath });
    } catch (error) {
      logger.error({ msg: '[Fetch Data Callback] Error', tmpPath, error });
      // await callback(false, '');
    }

    await unlink(tmpPath);
  } catch (error) {
    logger.error({ msg: '[Fetch Data Callback] Error', filePlaceholderId, error });
    await callback(false, '');
  }
}
