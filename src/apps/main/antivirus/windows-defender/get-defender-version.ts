import { logger } from '@internxt/drive-desktop-core/build/backend';
import { access, constants, readdir } from 'fs/promises';

export async function getDefenderVersions({ path }: { path: string }) {
  try {
    await access(path, constants.F_OK);
    const entries = await readdir(path, { withFileTypes: true });
    const validDirs = await Promise.all(
      entries.map((entry) => {
        return entry.isDirectory() ? entry.name : null;
      }),
    );

    logger.debug({ msg: 'Antivirus valid dirs', validDirs });

    return (
      validDirs
        .filter((name): name is string => Boolean(name))
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
