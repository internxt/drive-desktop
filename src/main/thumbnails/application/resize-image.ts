// import sharp from 'sharp';
import gm from 'gm';
import { Readable } from 'stream';

import { ThumbnailProperties } from '../domain/ThumbnailProperties';

export function reziseImage(file: Readable): Buffer {
  //const sharpStream = sharp({ failOn: 'error' });
  /*const promises = [];

  const gm2 = (gm(file).resize(300, 300).stream()).read() as Buffer;
  promises.push(
    gm(file).resize(ThumbnailProperties.dimensions, ThumbnailProperties.dimensions).stream()
    sharpStream
      .clone()
      .resize(ThumbnailProperties.dimensions, ThumbnailProperties.dimensions)
      .png({ quality: 10, compressionLevel: 9 })
      .toBuffer()
  );*/

  //file.pipe(sharpStream);

  return gm(file)
    .resize(ThumbnailProperties.dimensions, ThumbnailProperties.dimensions)
    .stream()
    .read() as Buffer;
}
