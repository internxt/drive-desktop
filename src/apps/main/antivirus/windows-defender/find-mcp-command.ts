import { join } from 'path';
import { readdirSync, existsSync, statSync } from 'fs';
import { MpCmdRunNotFoundError } from './errors/mpcmdrun-not-found-error';

/**
 * Finds the full path to the Windows Defender MpCmdRun.exe executable.
 * Searches the Defender Platform directory for the latest version, falling back to the default path if necessary.
 * @returns {string} The full path to MpCmdRun.exe.
 * @throws {MpCmdRunNotFoundError} If MpCmdRun.exe cannot be found in any of the expected locations.
 */
export function findMpCmdRun(): string {
  const DEFENDER_PLATFORM_PATH = 'C:\\ProgramData\\Microsoft\\Windows Defender\\Platform';
  const DEFENDER_FALLBACK_PATH = 'C:\\Program Files\\Windows Defender\\MpCmdRun.exe';

  const platformSubdirs = existsSync(DEFENDER_PLATFORM_PATH)
    ? readdirSync(DEFENDER_PLATFORM_PATH)
        .filter((name) => statSync(join(DEFENDER_PLATFORM_PATH, name)).isDirectory())
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
    : [];

  const latestDefenderPath =
    platformSubdirs.length > 0 ? join(DEFENDER_PLATFORM_PATH, platformSubdirs[0], 'MpCmdRun.exe') : DEFENDER_FALLBACK_PATH;

  if (!existsSync(latestDefenderPath)) {
    throw new MpCmdRunNotFoundError();
  }

  return latestDefenderPath;
}
