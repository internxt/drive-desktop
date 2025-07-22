import { access, constants, readdir } from 'fs/promises';
import { join } from 'path';
import { stat } from '@/infra/file-system/services/stat';

export async function getDefenderVersions({ path }: { path: string }): Promise<string[]> {
  try {
    await access(path, constants.F_OK);
    const entries = await readdir(path);
    const validDirs = await Promise.all(
      entries.map(async (name) => {
        const fullPath = join(path, name);
        const { data } = await stat({ absolutePath: fullPath });
        return data?.isDirectory() ? name : null;
      }),
    );

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
