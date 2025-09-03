import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ThumbnailUploaderFactory } from '../infrastructure/ThumbnailUploaderFactory';
import { obtainImageToThumbnailIt } from './obtain-image-to-thumbnail-it';
import { logger } from '@/apps/shared/logger/logger';
import { FileUuid } from '../../database/entities/DriveFile';

type Props = {
  bucket: string;
  fileUuid: FileUuid;
  absolutePath: AbsolutePath;
};

export async function createAndUploadThumbnail({ bucket, fileUuid, absolutePath }: Props) {
  try {
    const uploader = ThumbnailUploaderFactory.build(bucket);

    const image = await obtainImageToThumbnailIt(absolutePath);
    if (!image) {
      return;
    }

    logger.debug({ msg: 'Create thumbnail', absolutePath });
    const result = await uploader.upload(fileUuid, image);
    if (result.error) {
      logger.error({ msg: '[THUMBNAIL] Error uploading thumbnail', exc: result.error });
    }
  } catch (exc) {
    logger.error({ msg: '[THUMBNAIL] Error processing thumbnail', exc });
  }
}
