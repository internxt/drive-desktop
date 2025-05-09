import { ThumbnailUploaderFactory } from '../infrastructure/ThumbnailUploaderFactory';
import { obtainImageToThumbnailIt } from './obtain-image-to-thumbnail-it';
import { logger } from '@/apps/shared/logger/logger';

export async function createAndUploadThumbnail(fileId: number, name: string, path: string) {
  try {
    const uploader = ThumbnailUploaderFactory.build();

    const image = await obtainImageToThumbnailIt(path);
    if (!image) {
      return;
    }

    logger.debug({ msg: 'Create thumbnail', path });
    await uploader.upload(fileId, image);
  } catch (exc) {
    logger.error({ msg: '[THUMBNAIL] Error processing thumbnail', exc });
  }
}
