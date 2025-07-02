import { CustomIpc } from '@/apps/shared/IPC/IPCs';
import { ipcMain } from 'electron';
import { FromMain, FromProcess } from './ipc';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { driveFilesCollection } from '@/apps/main/remote-sync/store';
import { driveFoldersCollection } from '@/apps/main/remote-sync/store';
import { logger } from '@/apps/shared/logger/logger';

const ipcMainDriveServerWip = ipcMain as unknown as CustomIpc<FromMain, FromProcess>;

export function setupIpcDriveServerWip() {
  void ipcMainDriveServerWip.handle('storageDeleteFileByUuid', async (_, props) => {
    const res = await driveServerWip.storage.deleteFileByUuid(props);

    if (!res.error) {
      try {
        await driveFilesCollection.update(props.uuid, { status: 'TRASHED' });
      } catch (exc) {
        logger.debug({
          tag: 'SYNC-ENGINE',
          msg: 'Error updating file status',
          uuid: props.uuid,
          exc,
        });
      }
    }

    return res;
  });

  void ipcMainDriveServerWip.handle('storageDeleteFolderByUuid', async (_, props) => {
    const res = await driveServerWip.storage.deleteFolderByUuid(props);

    if (!res.error) {
      try {
        await driveFoldersCollection.update(props.uuid, { status: 'TRASHED' });
      } catch (exc) {
        logger.debug({
          tag: 'SYNC-ENGINE',
          msg: 'Error updating folder status',
          uuid: props.uuid,
          exc,
        });
      }
    }

    return res;
  });
}
