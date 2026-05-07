import { logger } from '@internxt/drive-desktop-core/build/backend';
import { app } from 'electron';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { checkAndInstall } from './check-and-install';
import { downloadRelease } from './download-release';

const ReleaseSchema = z.object({
  name: z.string().regex(/^\d+\.\d+\.\d+$/, 'tag_name must match X.X.X'),
});

export async function checkForUpdates() {
  if (!app.isPackaged) return;

  try {
    const res = await fetch('https://api.github.com/repos/internxt/drive-desktop/releases/latest');
    const data = await res.json();
    const { name: latest } = ReleaseSchema.parse(data);

    if (!isNewer(INTERNXT_VERSION, latest)) {
      logger.debug({ msg: 'App is up to date', latest });
      setTimeout(checkForUpdates, 60 * 60 * 1000);
      return;
    }

    const fileName = `Internxt-Setup-${latest}.exe`;
    const filePath = join(tmpdir(), 'Internxt-Setup.exe');

    logger.debug({ msg: 'New release available', latest, filePath });

    const installing = await checkAndInstall({ filePath });
    if (installing) return true;

    // We don't want to block the main thread when downloading the release
    void downloadRelease({ fileName, filePath, latest });
  } catch (error) {
    logger.error({ msg: 'Check for updates failed', error });
  }
}

export function isNewer(current: string, latest: string) {
  const [la, lb, lc] = latest.split('.').map(Number);
  const [ca, cb, cc] = current.split('.').map(Number);
  return la > ca || (la === ca && (lb > cb || (lb === cb && lc > cc)));
}
