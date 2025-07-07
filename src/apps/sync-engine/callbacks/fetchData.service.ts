import { BindingsManager, CallbackDownload } from '../BindingManager';
import { FilePlaceholderId } from '../../../context/virtual-drive/files/domain/PlaceholderId';
import { basename } from 'path';
import { ipcRendererSyncEngine } from '../ipcRendererSyncEngine';
import { logger } from '@/apps/shared/logger/logger';
import { unlink } from 'fs/promises';
import { fileDownloading } from './file-downloading';
import { store } from './handleHydrate.service';

type TProps = {
  self: BindingsManager;
  filePlaceholderId: FilePlaceholderId;
  callback: CallbackDownload;
};

export async function fetchData({ self, filePlaceholderId, callback }: TProps) {
  let path: string | undefined;
  let nameWithExtension: string | undefined;

  try {
    const startTime = Date.now();
    path = await self.controllers.downloadFile.execute(filePlaceholderId, callback);
    nameWithExtension = basename(path);

    store.lastHydrated = nameWithExtension;

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Start fetching data',
      path,
      filePlaceholderId,
    });

    await fileDownloading({ path, nameWithExtension, callback });

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
      filePlaceholderId,
      path,
      error,
    });

    if (nameWithExtension) {
      ipcRendererSyncEngine.send('FILE_DOWNLOAD_ERROR', { nameWithExtension });
    }

    await callback(false, '');
  }

  if (path) {
    await unlink(path);
  }
}
