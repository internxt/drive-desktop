import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { Device, getPathFromDialog } from '@/apps/main/device/service';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { ipcMain, shell } from 'electron';
import { downloadFolder } from './download-folder';
import { abs, join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { getUserOrThrow } from '@/apps/main/auth/service';
import { broadcastToWindows } from '@/apps/main/windows';
import { buildBackupsEnvironment } from '@/apps/main/background-processes/backups/build-environment';

type Props = {
  device: Device;
  folderUuids?: FolderUuid[];
};

export async function downloadBackup({ device, folderUuids = [] }: Props) {
  const user = getUserOrThrow();
  const chosenItem = await getPathFromDialog();

  if (!chosenItem) {
    return;
  }

  const chosenPath = abs(chosenItem.path);

  const abortController = new AbortController();

  const { contentsDownloader } = buildBackupsEnvironment({ user, device });

  function eventListener() {
    logger.debug({ tag: 'BACKUPS', msg: 'Abort download for device', deviceName: device.plainName });
    abortController.abort();
  }

  const listenerName = 'abort-download-backups-' + device.uuid;
  ipcMain.on(listenerName, eventListener);

  const now = new Date().toISOString().replace('T', '').replaceAll('-', '').replaceAll(':', '').slice(0, 14);
  const rootPath = join(chosenPath, 'Backup_' + now, device.plainName);
  const rootUuids = folderUuids.length === 0 ? [device.uuid as FolderUuid] : folderUuids;

  logger.debug({
    tag: 'BACKUPS',
    msg: 'Download backup',
    name: device.plainName,
    rootPath,
    rootUuids,
  });

  for (const rootUuid of rootUuids) {
    if (abortController.signal.aborted) return;

    try {
      logger.debug({ tag: 'BACKUPS', msg: 'Download folder', rootUuid });

      await downloadFolder({
        user,
        device,
        rootUuid,
        rootPath,
        abortController,
        contentsDownloader,
      });

      logger.debug({ tag: 'BACKUPS', msg: 'Download folder finished', rootUuid });
    } catch (error) {
      logger.error({ tag: 'BACKUPS', msg: 'Error downloading folder', rootUuid, error });
    }
  }

  broadcastToWindows({ name: 'backup-download-progress', data: { id: device.uuid, progress: 0 } });

  ipcMain.removeAllListeners(listenerName);

  void shell.openPath(rootPath);
}
