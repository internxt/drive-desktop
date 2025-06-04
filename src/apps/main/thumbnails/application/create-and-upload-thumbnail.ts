import { ThumbnailUploaderFactory } from '../infrastructure/ThumbnailUploaderFactory';
import { obtainImageToThumbnailIt } from './obtain-image-to-thumbnail-it';
import { logger } from '@/apps/shared/logger/logger';

export async function createAndUploadThumbnail(bucket: string, fileId: number, name: string, path: string) {
  try {
    const uploader = ThumbnailUploaderFactory.build(bucket);

    const image = await obtainImageToThumbnailIt(path);
    if (!image) {
      return;
    }

    logger.debug({ msg: 'Create thumbnail', path });
    const result = await uploader.upload(fileId, image);
    if (result.error) {
      logger.error({ msg: '[THUMBNAIL] Error uploading thumbnail', exc: result.error });
    }
  } catch (exc) {
    logger.error({ msg: '[THUMBNAIL] Error processing thumbnail', exc });
  }
}
