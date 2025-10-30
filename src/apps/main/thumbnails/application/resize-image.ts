import gm from 'gm';
import { Readable } from 'stream';
import { ThumbnailConfig } from '../domain/ThumbnailProperties';

type Props = {
  file: Readable;
};

export async function resizeImage({ file }: Props): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    gm(file)
      .resize(ThumbnailConfig.MaxWidth, ThumbnailConfig.MaxHeight)
      .toBuffer(
        ThumbnailConfig.Type,
        (err: Error | null, buffer: Buffer) => {
          if (err) reject(err);
          resolve(buffer);
        }
      );
  });
}
