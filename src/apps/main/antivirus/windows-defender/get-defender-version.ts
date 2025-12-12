import { logger } from '@internxt/drive-desktop-core/build/backend';
import { access, constants, readdir } from 'node:fs/promises';

export async function getDefenderVersions({ path }: { path: string }) {
  try {
    await access(path, constants.F_OK);
    const entries = await readdir(path, { withFileTypes: true });
    const validDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

    logger.debug({ msg: 'Antivirus valid dirs', validDirs });

    return (
      validDirs
        /**
         * v2.5.6 Esteban Galvis
         * Defender platform has subdirectories with version numbers.
         * We sort them in descending order to get the latest version.
         * This ensures that we always use the most recent version of MpCmdRun.exe.
         */
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
    );
  } catch {
    return [];
  }
}
