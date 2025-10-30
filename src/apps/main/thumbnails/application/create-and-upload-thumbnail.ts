import { logger } from '@internxt/drive-desktop-core/build/backend';

import { ThumbnailUploaderFactory } from '../infrastructure/ThumbnailUploaderFactory';
import { obtainImageToThumbnailIt } from './obtain-image-to-thumbnail-it';

type Props = {
  id: number;
  absolutePath: string;
};

export async function createAndUploadThumbnail({id, absolutePath}: Props) {
    try {
    const uploader = ThumbnailUploaderFactory.build();

    const image = await obtainImageToThumbnailIt({ absolutePath });
    if (!image) {
      return;
    }

    logger.debug({ msg: 'Create thumbnail', absolutePath });
    await uploader.upload(id, image);
  } catch (err) {
    throw logger.error({ msg: '[THUMBNAIL] Error uploading thumbnail: ', err });
  }
}
