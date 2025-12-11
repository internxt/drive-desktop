import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { logger } from '@/apps/shared/logger/logger';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { StorageTypes } from '@internxt/sdk/dist/drive';
import { uploadThumbnail } from './upload-thumnail';
import { FileUuid } from '../database/entities/DriveFile';
import { CommonContext } from '@/apps/sync-engine/config';
import { nativeImage } from 'electron';

const SIZE = 300;

type Props = {
  ctx: CommonContext;
  fileUuid: FileUuid;
  path: AbsolutePath;
};

export async function createAndUploadThumbnail({ ctx, fileUuid, path }: Props) {
  const { bucket } = ctx;

  try {
    const image = nativeImage.createFromPath(path);

    if (image.isEmpty()) return;

    const buffer = image.resize({ width: SIZE }).toPNG();

    logger.debug({ msg: 'Upload thumbnail', path });

    const contentsId = await uploadThumbnail({ bucket, buffer });

    await driveServerWip.files.createThumbnail({
      body: {
        fileUuid,
        maxWidth: SIZE,
        maxHeight: SIZE,
        type: 'png',
        size: buffer.byteLength,
        bucketId: bucket,
        bucketFile: contentsId,
        encryptVersion: StorageTypes.EncryptionVersion.Aes03,
      },
    });
  } catch (error) {
    logger.error({ msg: 'Error uploading thumbnail', path, error });
  }
}
