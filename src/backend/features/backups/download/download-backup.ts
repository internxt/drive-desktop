import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { Device, getPathFromDialog } from '@/apps/main/device/service';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { ipcMain } from 'electron';
import { downloadFolder } from './download-folder';
import { abs, join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { getUserOrThrow } from '@/apps/main/auth/service';
import { getConfig } from '@/apps/sync-engine/config';
import { INTERNXT_CLIENT, INTERNXT_VERSION } from '@/core/utils/utils';
import { InxtJs } from '@/infra';
import { Environment } from '@internxt/inxt-js';
import Bottleneck from 'bottleneck';
import { broadcastToWindows } from '@/apps/main/windows';

type Props = {
  device: Device;
  folderUuids?: FolderUuid[];
};

export async function downloadBackup({ device, folderUuids }: Props) {
  const user = getUserOrThrow();
  const chosenItem = await getPathFromDialog();

  if (!chosenItem) {
    return;
  }

  const chosenPath = abs(chosenItem.path);

  const limiter = new Bottleneck({ maxConcurrent: 4 });
  const abortController = new AbortController();

  const environment = new Environment({
    bridgeUrl: process.env.BRIDGE_URL,
    bridgeUser: getConfig().bridgeUser,
    bridgePass: getConfig().bridgePass,
    encryptionKey: getConfig().mnemonic,
    appDetails: {
      clientName: INTERNXT_CLIENT,
      clientVersion: INTERNXT_VERSION,
      desktopHeader: process.env.DESKTOP_HEADER,
    },
  });

  const contentsDownloader = new InxtJs.ContentsDownloader(environment, device.bucket);

  async function eventListener() {
    logger.debug({ tag: 'BACKUPS', msg: 'Abort download for device', deviceName: device.name });
    abortController.abort();
    await limiter.stop();
  }

  const listenerName = 'abort-download-backups-' + device.uuid;
  ipcMain.on(listenerName, eventListener);

  const now = new Date().toISOString().replace('T', '').replaceAll('-', '').replaceAll(':', '').slice(0, 14);
  const rootPath = join(chosenPath, 'Backup_' + now);
  const rootUuids = folderUuids ?? [device.uuid as FolderUuid];

  logger.debug({
    tag: 'BACKUPS',
    msg: 'Download backup',
    name: device.name,
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
        limiter,
      });

      logger.debug({ tag: 'BACKUPS', msg: 'Download folder finished', rootUuid });
    } catch (error) {
      logger.error({ tag: 'BACKUPS', msg: 'Error downloading folder', rootUuid, error });
    }
  }

  broadcastToWindows({ name: 'backup-download-progress', data: { id: device.uuid, progress: 100 } });

  ipcMain.removeListener(listenerName, eventListener);
}
