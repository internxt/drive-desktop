import { rm } from 'node:fs/promises';
import { IpcMainEvent, ipcMain } from 'electron';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import type { Device } from './types/Device';
import { broadcastToWindows } from '../../../apps/main/windows';
import { downloadDeviceBackupZip } from './download-device-backup-zip';
import { AbsolutePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import path from 'node:path';
import { getUser } from '../../../apps/main/auth/service';

function createBackupZipFilePath({ pathname }: { pathname: AbsolutePath }) {
  const date = new Date();
  const timestamp = [
    String(date.getFullYear()),
    String(date.getMonth() + 1),
    String(date.getDate()),
    String(date.getHours()),
    String(date.getMinutes()),
    String(date.getSeconds()),
  ].join('');

  return path.join(pathname, `Backup_${timestamp}.zip`);
}

type Props = {
  device: Device;
  pathname: AbsolutePath;
};

export async function downloadBackup({ device, pathname }: Props): Promise<void> {
  const user = getUser();
  if (!user) {
    throw logger.error({ tag: 'BACKUPS', msg: 'No user found when trying to download backup' });
  }

  logger.debug({
    tag: 'BACKUPS',
    msg: '[BACKUPS] Downloading Device',
    deviceName: device.name,
    pathname,
  });

  const zipFilePath = createBackupZipFilePath({ pathname });
  const abortController = new AbortController();

  const abortListener = (_: IpcMainEvent, abortDeviceUuid: string) => {
    if (abortDeviceUuid === device.uuid) {
      abortController.abort();
    }
  };

  const listenerName = 'abort-download-backups-' + device.uuid;
  const removeListenerIpc = ipcMain.on(listenerName, abortListener);

  try {
    await downloadDeviceBackupZip({
      user,
      device,
      path: zipFilePath,
      updateProgress: (progress) => {
        if (abortController.signal.aborted) {
          return;
        }

        broadcastToWindows('backup-download-progress', {
          id: device.uuid,
          progress,
        });
      },
      abortController,
    });
  } catch (error) {
    logger.error({ tag: 'BACKUPS', msg: 'Error downloading backup for device', deviceName: device.name, error });
    await rm(zipFilePath, { force: true });
  }

  removeListenerIpc.removeListener(listenerName, abortListener);
}
