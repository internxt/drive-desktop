import { join } from 'path';
import { access, constants } from 'fs/promises';
import { getDefenderVersions } from './get-defender-version';
import { logger } from '@/apps/shared/logger/logger';

export async function findMpCmdRun() {
  const DEFENDER_PLATFORM_PATH = 'C:\\ProgramData\\Microsoft\\Windows Defender\\Platform';
  const DEFENDER_FALLBACK_PATH = 'C:\\Program Files\\Windows Defender\\MpCmdRun.exe';

  const platformSubdirs = await getDefenderVersions({ path: DEFENDER_PLATFORM_PATH });
  const mpCmdRunPath =
    platformSubdirs.length > 0 ? join(DEFENDER_PLATFORM_PATH, platformSubdirs[0], 'MpCmdRun.exe') : DEFENDER_FALLBACK_PATH;

  try {
    await access(mpCmdRunPath, constants.F_OK);
  } catch {
    throw logger.error({
      tag: 'ANTIVIRUS',
      msg: 'MpCmdRun.exe not found.',
      mpCmdRunPath,
    });
  }

  return mpCmdRunPath;
}
