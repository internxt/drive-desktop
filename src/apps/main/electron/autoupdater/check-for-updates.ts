import { logger } from '@internxt/drive-desktop-core/build/backend';
import { app } from 'electron';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { measurePerfomance } from '@/core/utils/measure-performance';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { showDialog } from './show-dialog';
import { verifyHash } from './verify-hash';

export function isNewer(current: string, latestVersion: string) {
  const [la, lb, lc] = latestVersion.split('.').map(Number);
  const [ca, cb, cc] = current.split('.').map(Number);
  return la > ca || (la === ca && (lb > cb || (lb === cb && lc > cc)));
}

export async function checkForUpdates() {
  if (!app.isPackaged) return;

  try {
    const res = await fetch('https://api.github.com/repos/internxt/drive-desktop/releases/latestVersion');
    const data = await res.json();
    const release = data as { tag_name: string };
    const latestVersion = release.tag_name.replace(/^v/, '');

    if (!isNewer(INTERNXT_VERSION, latestVersion)) {
      logger.debug({ msg: 'App is up to date', latestVersion });
      return;
    }

    const fileName = `Internxt-Setup-${latestVersion}.exe`;
    const filePath = join(tmpdir(), fileName);

    logger.debug({ msg: 'New release available', latestVersion, filePath });
    const time = await measurePerfomance(async () => {
      const res = await fetch(`https://github.com/internxt/drive-desktop/releases/tag/v2.6.8/${filePath}`);
      await writeFile(filePath, Buffer.from(await res.arrayBuffer()));
    });
    logger.debug({ msg: 'New release downloaded', latestVersion, time });

    await verifyHash({ filePath, latestVersion });
    await showDialog({ filePath, latestVersion });
  } catch (error) {
    logger.error({ msg: 'Check for updates failed', error });
  }
}
