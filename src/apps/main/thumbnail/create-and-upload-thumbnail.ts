import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { logger } from '@/apps/shared/logger/logger';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { EncryptionVersion } from '@/infra/drive-server-wip/defs';
import { uploadThumbnail } from './upload-thumnail';
import { FileUuid } from '../database/entities/DriveFile';
import { CommonContext } from '@/apps/sync-engine/config';
import { nativeImage } from 'electron';
import { toWin32Path } from '@/node-win/addon-wrapper';
import { extname } from 'node:path';

const THUMBNAILABLE_EXTENSIONS = new Set([
  // Images
  '.jpg',
  '.jpeg',
  '.png',
  '.bmp',
  '.gif',
  // PDF
  '.pdf',
  // Videos
  '.webm',
  '.mkv',
  '.vob',
  '.ogv',
  '.ogg',
  '.drc',
  '.avi',
  '.mts',
  '.m2ts',
  '.mov',
  '.qt',
  '.wmv',
  '.yuv',
  '.rm',
  '.rmvb',
  '.viv',
  '.asf',
  '.amv',
  '.mp4',
  '.mpg4',
  '.m4v',
  '.mpg',
  '.mpeg',
  '.mpe',
  '.mpv',
  '.m2v',
  '.svi',
  '.3gp',
  '.3g2',
  '.mxf',
  '.roq',
  '.nsv',
  '.flv',
  '.f4v',
  '.f4p',
  '.f4a',
  '.f4b',
]);

const SIZE = 300;

type Props = {
  ctx: CommonContext;
  fileUuid: FileUuid;
  path: AbsolutePath;
};

export async function createAndUploadThumbnail({ ctx, fileUuid, path }: Props) {
  try {
    const ext = extname(path).toLowerCase();

    if (!THUMBNAILABLE_EXTENSIONS.has(ext)) {
      return;
    }

    /**
     * v2.6.6 Daniel Jiménez
     * We have to be careful with this because even if we upload the file or the thumbnail in streams, there
     * are electron functions that load the whole file into memory like `createFromPath`.
     * This is the C++ implementation of `createThumbnailFromPath`:
     * https://github.com/electron/electron/blob/51a9101c3de7794baad9c35cce57adecf9ea3ad3/shell/common/api/electron_api_native_image_win.cc
     */
    const win32Path = toWin32Path(path);
    const image = await nativeImage.createThumbnailFromPath(win32Path, { width: SIZE, height: SIZE });
    const buffer = image.toPNG();

    ctx.logger.debug({ msg: 'Upload thumbnail', path });

    const contentsId = await uploadThumbnail({ ctx, buffer });

    await driveServerWip.files.createThumbnail({
      ctx,
      context: {
        body: {
          fileUuid,
          maxWidth: SIZE,
          maxHeight: SIZE,
          type: 'png',
          size: buffer.byteLength,
          bucketId: ctx.bucket,
          bucketFile: contentsId,
          encryptVersion: EncryptionVersion.Aes03,
        },
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Failed to get thumbnail from local thumbnail cache reference') return;

    logger.error({ msg: 'Error uploading thumbnail', path, error });
  }
}
