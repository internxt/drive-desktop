import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { InxtJs } from '@/infra';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';

type Props = {
  file: ExtendedDriveFile;
  contentsDownloader: InxtJs.ContentsDownloader;
};

export async function downloadFile({ file, contentsDownloader }: Props) {
  logger.debug({ tag: 'BACKUPS', msg: 'Download file', path: file.absolutePath });

  await mkdir(dirname(file.absolutePath), { recursive: true });

  try {
    const writeStream = createWriteStream(file.absolutePath);

    const { data: readStream, error } = await contentsDownloader.download({ contentsId: file.contentsId });

    if (error) throw error;

    await pipeline(readStream, writeStream);
  } catch (error) {
    logger.error({
      tag: 'BACKUPS',
      msg: 'Error downloading file',
      path: file.absolutePath,
      error,
    });
  }
}
