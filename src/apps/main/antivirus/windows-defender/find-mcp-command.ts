import { join } from 'path';
import { readdirSync, existsSync } from 'fs';
import { stat } from '@/infra/file-system/services/stat';
import { logger } from '@/apps/shared/logger/logger';

export async function findMpCmdRun() {
  const DEFENDER_PLATFORM_PATH = 'C:\\ProgramData\\Microsoft\\Windows Defender\\Platform';
  const DEFENDER_FALLBACK_PATH = 'C:\\Program Files\\Windows Defender\\MpCmdRun.exe';

  let platformSubdirs: string[] = [];
  if (existsSync(DEFENDER_PLATFORM_PATH)) {
    const entries = readdirSync(DEFENDER_PLATFORM_PATH);
    const validDirs = await Promise.all(
      entries.map(async (name) => {
        const fullPath = join(DEFENDER_PLATFORM_PATH, name);
        const { data, error } = await stat({ absolutePath: fullPath });
        return !error && data?.isDirectory() ? name : null;
      }),
    );

    platformSubdirs = validDirs
      .filter((name): name is string => Boolean(name))
      /**
       * v2.5.6 Esteban Galvis
       * Defender platform has subdirectories with version numbers.
       * We sort them in descending order to get the latest version.
       * This ensures that we always use the most recent version of MpCmdRun.exe.
       */
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  }

  let mpCmdRunPath: string;
  if (platformSubdirs.length > 0) {
    mpCmdRunPath = join(DEFENDER_PLATFORM_PATH, platformSubdirs[0], 'MpCmdRun.exe');
  } else {
    mpCmdRunPath = DEFENDER_FALLBACK_PATH;
  }

  if (!existsSync(mpCmdRunPath)) {
    throw logger.error({
      tag: 'ANTIVIRUS',
      msg: 'MpCmdRun.exe not found.',
      mpCmdRunPath,
    });
  }

  return mpCmdRunPath;
}
