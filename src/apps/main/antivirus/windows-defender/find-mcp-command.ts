import { join } from 'node:path';
import { access, constants } from 'node:fs/promises';
import { getDefenderVersions } from './get-defender-version';
import { logger } from '@/apps/shared/logger/logger';

export async function findMpCmdRun() {
  const DEFENDER_PLATFORM_PATH = 'C:\\ProgramData\\Microsoft\\Windows Defender\\Platform';
  const DEFENDER_FALLBACK_PATH = 'C:\\Program Files\\Windows Defender\\MpCmdRun.exe';

  const platformSubdirs = await getDefenderVersions({ path: DEFENDER_PLATFORM_PATH });
  const latestPlatformSubdir = platformSubdirs.at(0);
  const mpCmdRunPath = latestPlatformSubdir ? join(DEFENDER_PLATFORM_PATH, latestPlatformSubdir, 'MpCmdRun.exe') : DEFENDER_FALLBACK_PATH;

  try {
    await access(mpCmdRunPath, constants.F_OK);
  } catch {
    logger.error({
      tag: 'ANTIVIRUS',
      msg: 'MpCmdRun.exe not found.',
      mpCmdRunPath,
    });
    return null;
  }

  return mpCmdRunPath;
}
