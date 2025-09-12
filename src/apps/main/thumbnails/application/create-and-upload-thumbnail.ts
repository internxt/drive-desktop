import { logger } from '@internxt/drive-desktop-core/build/backend';

import { ThumbnailUploaderFactory } from '../infrastructure/ThumbnailUploaderFactory';
import { obtainImageToThumbnailIt } from './obtain-image-to-thumbnail-it';
import { reziseImage } from './resize-image';

export async function createAndUploadThumbnail(id: number, name: string) {
  const uploader = ThumbnailUploaderFactory.build();

  const image = await obtainImageToThumbnailIt(name);

  if (!image) {
    return;
  }

  const thumbnail = await reziseImage(image);

  await uploader.upload(id, thumbnail).catch((err) => {
    logger.error({ msg: '[THUMBNAIL] Error uploading thumbnail: ', err });
  });
}
