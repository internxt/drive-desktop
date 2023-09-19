import { Readable } from 'stream';

export async function extractFirstPageAsReadablePNG(
  pdfPath: string
): Promise<Readable> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const gm = require('gm').subClass({ imageMagick: true });

  return gm(pdfPath + '[0]')
    .density(300, 300)
    .quality(100)
    .stream('png');
}
