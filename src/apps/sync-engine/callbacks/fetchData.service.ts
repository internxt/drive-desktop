import { FilePlaceholderId } from '../../../context/virtual-drive/files/domain/PlaceholderId';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { logger } from '@/apps/shared/logger/logger';
import { CallbackDownload } from '@/node-win/types/callbacks.type';
import { ProcessContainer } from '../build-process-container';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';

type TProps = {
  container: ProcessContainer;
  placeholderId: FilePlaceholderId;
  callback: CallbackDownload;
};

export async function fetchData({ container, placeholderId, callback }: TProps) {
  try {
    logger.debug({ msg: 'Download file', placeholderId });

    const uuid = NodeWin.getFileUuidFromPlaceholder({ placeholderId });

    const { data: file, error } = await ipcRendererSqlite.invoke('fileGetByUuid', { uuid });

    if (error) throw error;

    await container.downloadFile.execute(file, callback);
  } catch (error) {
    logger.error({ msg: 'Error downloading file', placeholderId, error });
  }
}
