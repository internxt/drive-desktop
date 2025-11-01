import { FilePlaceholderId } from '../../../context/virtual-drive/files/domain/PlaceholderId';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { logger } from '@/apps/shared/logger/logger';
import { unlink } from 'node:fs/promises';
import { CallbackDownload } from '@/node-win/types/callbacks.type';
import { ProcessContainer } from '../build-process-container';
import { ipcRendererSyncEngine } from '../ipcRendererSyncEngine';

type TProps = {
  container: ProcessContainer;
  placeholderId: FilePlaceholderId;
  callback: CallbackDownload;
};

export async function fetchData({ container, placeholderId, callback }: TProps) {
  try {
    logger.debug({ msg: '[Fetch Data Callback] Donwloading begins' });

    const uuid = NodeWin.getFileUuidFromPlaceholder({ placeholderId });
    const file = await container.downloadFile.fileFinderByUuid({ uuid });

    const tmpPath = await container.downloadFile.execute(file, callback);

    logger.debug({ msg: '[Fetch Data Callback] Preparing begins', tmpPath });

    let finished = false;

    try {
      while (!finished) {
        const result = await callback(true, tmpPath);
        finished = result.finished;
      }

      ipcRendererSyncEngine.send('FILE_DOWNLOADED', { key: file.uuid, nameWithExtension: file.nameWithExtension });
      logger.debug({ msg: '[Fetch Data Callback] Finish', tmpPath });
    } catch (error) {
      logger.error({ msg: '[Fetch Data Callback] Error', tmpPath, error });
    }

    await unlink(tmpPath);
  } catch (error) {
    logger.error({ msg: '[Fetch Data Callback] Error', placeholderId, error });
    await callback(false, '');
  }
}
