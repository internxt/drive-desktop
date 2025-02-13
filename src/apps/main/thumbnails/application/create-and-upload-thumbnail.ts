import Logger from 'electron-log';

import { ThumbnailUploaderFactory } from '../infrastructure/ThumbnailUploaderFactory';
import { obtainImageToThumbnailIt } from './obtain-image-to-thumbnail-it';
import * as Sentry from '@sentry/electron/main';

export async function createAndUploadThumbnail(
  fileId: number,
  name: string,
  path: string
) {
  Logger.info(`[THUMBNAIL] Uploading thumbnail for ${path}`);

  try {
    const uploader = ThumbnailUploaderFactory.build();

    const image = await obtainImageToThumbnailIt(path);
    if (!image) {
      Logger.warn(
        `[THUMBNAIL] No image found to create a thumbnail for ${name}`
      );
      return;
    }

    Logger.info(`[THUMBNAIL] Uploading thumbnail for ${name}`);

    await uploader.upload(fileId, image);
  } catch (err) {
    Logger.error('[THUMBNAIL] Error processing thumbnail: ', err);
    Sentry.captureException(err);
  }
}
