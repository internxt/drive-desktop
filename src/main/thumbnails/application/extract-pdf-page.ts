import { Readable } from 'stream';
import Logger from 'electron-log';
import fs from 'fs';
import gm from 'gm';

export async function extractFirstPageAsReadablePNG(
  pdfPath: string
): Promise<Readable | undefined> {
  return new Promise((resolve, reject) => {
    const pdf = fs.createReadStream(pdfPath);

    gm(pdf)
      .selectFrame(0)
      .stream('png', (err: Error | null, stream: Readable) => {
        if (err) {
          Logger.error(
            '[THUMBNAIL] Error generating thumbnail for a pdf: ',
            err
          );
          reject(err);
        }

        resolve(stream);
      });
  });
}
