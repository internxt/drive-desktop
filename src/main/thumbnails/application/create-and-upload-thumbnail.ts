import Logger from 'electron-log';
import { ThumbnailUploaderFactory } from '../infrastructure/ThumbnailUploaderFactory';
import { reziseImage } from './resize-image';
import { obtainImageToThumbnailIt } from './obtain-image-to-thumbnail-it';

export async function createAndUploadThumbnail(id: number, name: string) {
  const uploader = ThumbnailUploaderFactory.build();

  const image = await obtainImageToThumbnailIt(name);

  if (!image) return;

  const thumbnail = await reziseImage(image);

  await uploader.upload(id, thumbnail).catch((err) => {
    Logger.error('[THUMBNAIL] Error uploading thumbnail: ', err);
  });
}
