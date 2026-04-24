import { logger } from '@internxt/drive-desktop-core/build/backend';
import { app } from 'electron';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { measurePerfomance } from '@/core/utils/measure-performance';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { checkExistingFile } from './check-existing-file';
import { showDialog } from './show-dialog';
import { verifyHash } from './verify-hash';

export async function checkForUpdates() {
  if (!app.isPackaged) return;

  try {
    const res = await fetch('https://api.github.com/repos/internxt/drive-desktop/releases/latest');
    const data = await res.json();
    const release = data as { tag_name: string };
    const latest = release.tag_name.replace(/^v/, '');

    if (!isNewer(INTERNXT_VERSION, latest)) {
      logger.debug({ msg: 'App is up to date', latest });
      return;
    }

    const fileName = `Internxt-Setup-${latest}.exe`;
    const filePath = join(tmpdir(), fileName);

    logger.debug({ msg: 'New release available', latest, filePath });

    await checkExistingFile({ latest, filePath });

    const time = await measurePerfomance(async () => {
      const url = `https://github.com/internxt/drive-desktop/releases/download/v${latest}/${fileName}`;
      const res = await fetch(url);
      await writeFile(filePath, Buffer.from(await res.arrayBuffer()));
    });

    logger.debug({ msg: 'New release downloaded', time });

    await verifyHash({ filePath, latest });
    await showDialog({ filePath, latest });
  } catch (error) {
    logger.error({ msg: 'Check for updates failed', error });
  }
}

export function isNewer(current: string, latest: string) {
  const [la, lb, lc] = latest.split('.').map(Number);
  const [ca, cb, cc] = current.split('.').map(Number);
  return la > ca || (la === ca && (lb > cb || (lb === cb && lc > cc)));
}
