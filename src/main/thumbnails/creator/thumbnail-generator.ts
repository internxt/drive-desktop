import sharp from 'sharp';
import { Readable } from 'stream';
import { ThumbnailProperties } from '../ThumbnailProperties';

export async function reziseImage(file: Readable): Promise<Buffer> {
  const sharpStream = sharp({ failOn: 'error' });
  const promises = [];

  promises.push(
    sharpStream
      .clone()
      .resize(ThumbnailProperties.dimensions, ThumbnailProperties.dimensions)
      .png()
      .toBuffer()
  );

  file.pipe(sharpStream);

  return (await Promise.all(promises))[0] as unknown as Buffer;
}
