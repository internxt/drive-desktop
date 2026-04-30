import { logger } from '@internxt/drive-desktop-core/build/backend';
import { createWriteStream } from 'node:fs';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { captureSentryDownloadError } from '@/apps/shared/sentry/sentry';
import { pipeline } from '@/core/utils/pipeline';
import { InxtJs } from '@/infra';
import { LocalSync } from '../..';

type Props = {
  file: ExtendedDriveFile;
  contentsDownloader: InxtJs.ContentsDownloader;
};

export async function downloadFile({ file, contentsDownloader }: Props) {
  const path = file.absolutePath;

  try {
    logger.debug({ tag: 'BACKUPS', msg: 'Download file', path });

    const writable = createWriteStream(path);

    const readable = await contentsDownloader.downloadThrow({
      path,
      contentsId: file.contentsId,
    });

    const error = await pipeline({ readable, writable });

    if (!error) {
      LocalSync.SyncState.addItem({ action: 'DOWNLOADED', path });
      return;
    }

    if (error.code === 'ABORTED') {
      LocalSync.SyncState.addItem({ action: 'DOWNLOAD_CANCEL', path });
      return;
    }

    throw error;
  } catch (error) {
    LocalSync.SyncState.addItem({ action: 'DOWNLOAD_ERROR', path });
    logger.error({ tag: 'BACKUPS', msg: 'Error downloading file', path, error });

    await captureSentryDownloadError({
      error,
      fileUuid: file.uuid,
      contentsId: file.contentsId,
      fileSize: file.size,
      destinationPath: file.absolutePath,
      downloadFailureSource: 'backup-download',
    });
  }
}
