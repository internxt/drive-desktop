import { logger } from '@internxt/drive-desktop-core/build/backend';
import { writeFile } from 'node:fs/promises';
import { measurePerfomance } from '@/core/utils/measure-performance';
import { showDialog } from './show-dialog';
import { verifyHash } from './verify-hash';

export async function downloadRelease({ fileName, filePath, latest }: { fileName: string; filePath: string; latest: string }) {
  try {
    const time = await measurePerfomance(async () => {
      const url = `https://github.com/internxt/drive-desktop/releases/download/v${latest}/${fileName}`;
      const res = await fetch(url);
      await writeFile(filePath, Buffer.from(await res.arrayBuffer()));
    });

    logger.debug({ msg: 'New release downloaded', time });

    await verifyHash({ filePath, latest });
    await showDialog({ filePath, latest });
  } catch (error) {
    logger.error({ msg: 'Cannot download release', latest, error });
  }
}
