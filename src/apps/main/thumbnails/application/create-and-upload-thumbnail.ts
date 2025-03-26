import { ThumbnailUploaderFactory } from '../infrastructure/ThumbnailUploaderFactory';
import { obtainImageToThumbnailIt } from './obtain-image-to-thumbnail-it';
import { logger } from '@/apps/shared/logger/logger';

export async function createAndUploadThumbnail(fileId: number, name: string, path: string) {
  logger.debug({ msg: '[THUMBNAIL] Uploading thumbnail', path });

  try {
    const uploader = ThumbnailUploaderFactory.build();

    const image = await obtainImageToThumbnailIt(path);
    if (!image) {
      logger.warn({ msg: '[THUMBNAIL] No image found to create a thumbnail', name });
      return;
    }

    logger.debug({ msg: '[THUMBNAIL] Uploading thumbnail', name });

    await uploader.upload(fileId, image);
  } catch (exc) {
    logger.error({ msg: '[THUMBNAIL] Error processing thumbnail', exc });
  }
}
