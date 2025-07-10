import { join } from 'path';
import { readdirSync, existsSync, statSync } from 'fs';

/**
 * Finds the full path to the Windows Defender MpCmdRun.exe executable.
 * Searches the Defender Platform directory for the latest version, falling back to the default path if necessary.
 * @returns {string} The full path to MpCmdRun.exe.
 * @throws {Error} If MpCmdRun.exe cannot be found in any of the expected locations.
 */
export function findMpCmdRun() {
  const DEFENDER_PLATFORM_PATH = 'C:\\ProgramData\\Microsoft\\Windows Defender\\Platform';
  const DEFENDER_FALLBACK_PATH = 'C:\\Program Files\\Windows Defender\\MpCmdRun.exe';

  let fullPath = DEFENDER_FALLBACK_PATH;

  if (existsSync(DEFENDER_PLATFORM_PATH)) {
    const versions = readdirSync(DEFENDER_PLATFORM_PATH)
      .filter((name) => statSync(join(DEFENDER_PLATFORM_PATH, name)).isDirectory())
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true })); // Order by version descending

    if (versions.length > 0) {
      fullPath = join(DEFENDER_PLATFORM_PATH, versions[0], 'MpCmdRun.exe');
    }
  }

  if (!existsSync(fullPath)) {
    throw new Error('MpCmdRun.exe not found.');
  }

  return fullPath;
}
