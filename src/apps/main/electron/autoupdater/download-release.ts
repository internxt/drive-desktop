import { logger } from '@internxt/drive-desktop-core/build/backend';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { ReadableStream } from 'node:stream/web';
import { measurePerfomance } from '@/core/utils/measure-performance';
import { showDialog } from './show-dialog';
import { verifyHash } from './verify-hash';

export async function downloadRelease({ fileName, filePath, latest }: { fileName: string; filePath: string; latest: string }) {
  try {
    logger.debug({ msg: 'Downloading release', latest });

    const time = await measurePerfomance(async () => {
      const url = `https://github.com/internxt/drive-desktop/releases/download/v${latest}/${fileName}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const readStream = Readable.fromWeb(res.body as ReadableStream);
      const writeStream = createWriteStream(filePath);
      await pipeline(readStream, writeStream);
    });

    logger.debug({ msg: 'New release downloaded', time });

    await verifyHash({ filePath, latest });
    await showDialog({ filePath, latest });
  } catch (error) {
    logger.error({ msg: 'Cannot download release', latest, error });
  }
}
