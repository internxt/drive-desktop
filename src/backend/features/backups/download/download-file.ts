import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { pipeline } from '@/core/utils/pipeline';
import { InxtJs } from '@/infra';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { createWriteStream } from 'node:fs';

type Props = {
  file: ExtendedDriveFile;
  contentsDownloader: InxtJs.ContentsDownloader;
};

export async function downloadFile({ file, contentsDownloader }: Props) {
  try {
    logger.debug({ tag: 'BACKUPS', msg: 'Download file', path: file.absolutePath });

    const writable = createWriteStream(file.absolutePath);

    const readable = await contentsDownloader.downloadThrow({
      path: file.absolutePath,
      contentsId: file.contentsId,
    });

    const error = await pipeline({ readable, writable });

    if (error) {
      if (error.code === 'ABORTED') return;
      throw error;
    }
  } catch (error) {
    logger.error({ tag: 'BACKUPS', msg: 'Error downloading file', path: file.absolutePath, error });
  }
}
