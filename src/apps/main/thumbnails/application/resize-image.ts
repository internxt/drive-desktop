import gm from 'gm';
import { Readable } from 'stream';
import { ThumbnailProperties } from '../domain/ThumbnailProperties';

export async function reziseImage(file: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    gm(file)
      .resize(ThumbnailProperties.dimensions, ThumbnailProperties.dimensions)
      .toBuffer(
        ThumbnailProperties.type,
        (err: Error | null, buffer: Buffer) => {
          if (err) reject(err);
          resolve(buffer);
        }
      );
  });
}
