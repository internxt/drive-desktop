import { createReadStream } from 'fs';
import path from 'path';
import Logger from 'electron-log';
import { Readable } from 'stream';
import configStore from '../config';
import { getUploader } from './uploader/get-uploader';
import { isImageThumbnailable } from './ThumbnableExtension';
import { reziseImage } from './creator/thumbnail-generator';

function getExtension(pathLike: string) {
  const { ext } = path.parse(pathLike);

  return ext.replace('.', '');
}

function getStream(name: string): Readable | undefined {
  const ext = getExtension(name);

  const root = configStore.get('syncRoot');
  const filePath = path.join(root, name);

  if (!isImageThumbnailable(ext)) {
    return;
  }

  return createReadStream(filePath);
}

export async function createThumbnail(id: number, name: string) {
  try {
    const uploader = getUploader();

    if (!uploader) {
      return;
    }

    const image = getStream(name);

    if (!image) return;

    const thumbnail = await reziseImage(image);

    const r = await uploader.upload(id, thumbnail).catch((err) => {
      Logger.error(err);
    });

    Logger.debug(`THUMBNAIL CREATED ${JSON.stringify(r)}`);
  } catch (err) {
    Logger.error(err);
  }
}
