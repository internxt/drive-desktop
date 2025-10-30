import { ThumbnailConfig } from '../domain/ThumbnailProperties';

type Props = {
  absolutePath: string;
};

export async function generatePDFThumbnail({ absolutePath }: Props): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const gm = require('gm').subClass({ imageMagick: true });

  return new Promise((resolve, reject) => {
    gm(absolutePath + '[0]')
      .density(300, 300)
      .quality(ThumbnailConfig.Quality)
      .resize(ThumbnailConfig.MaxWidth, ThumbnailConfig.MaxHeight)
      .toBuffer(ThumbnailConfig.Type, (err: Error | null, buffer: Buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      });
  });
}
