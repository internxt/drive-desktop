import Logger from 'electron-log';

import { ThumbnailUploaderFactory } from '../infrastructure/ThumbnailUploaderFactory';
import { obtainImageToThumbnailIt } from './obtain-image-to-thumbnail-it';
import { reziseImage } from './resize-image';
import * as Sentry from '@sentry/electron/main';

export async function createAndUploadThumbnail(id: number, name: string) {
  Logger.info(`[THUMBNAIL] Creating thumbnail for ${name}`);

  try {
    const uploader = ThumbnailUploaderFactory.build();

    const image = await obtainImageToThumbnailIt(name);
    if (!image) {
      Logger.warn(
        `[THUMBNAIL] No image found to create a thumbnail for ${name}`
      );
      return;
    }

    Logger.info(`[THUMBNAIL] Resizing thumbnail for ${name}`);
    const thumbnail = await reziseImage(image);

    Logger.info(`[THUMBNAIL] Uploading thumbnail for ${name}`);
    await uploader.upload(id, thumbnail).catch((err) => {
      Logger.error('[THUMBNAIL] Error uploading thumbnail: ', err);
      Sentry.captureException(err);
    });
  } catch (err) {
    Logger.error('[THUMBNAIL] Error processing thumbnail: ', err);
    Sentry.captureException(err);
  }
}
