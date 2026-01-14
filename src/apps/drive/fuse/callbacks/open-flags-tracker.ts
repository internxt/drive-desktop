import { logger } from '@internxt/drive-desktop-core/build/backend';

/**
 * v.2.5.1
 * Esteban Galvis Triana
 * Flag patterns observed:
 * - 294912 (0x48000): System opening file (thumbnails, directory browsing)
 * - 32768 (0x8000): User opening file (actual file access)
 */

const SYSTEM_OPEN_FLAG = 294912;
const USER_OPEN_FLAG = 32768;

/**
 * v.2.5.1
 * Esteban Galvis Triana
 * Files in set trigger system verification to select the default application,
 * causing a system-level open flag that crashes the file open.
 * Added as an exception since user-initiated opens cannot be reliably
 * distinguished from system checks.
 */
const DOWNLOAD_WHITELIST = new Set(['.png', '.json']);

const fileFlags = new Map<string, number>();

export function trackOpen(path: string, flag: number): void {
  fileFlags.set(path, flag);
  logger.debug({
    msg: '[OpenFlagsTracker] File opened:',
    path,
    flag,
    isSystemOpen: isSystemOpen(flag),
    isUserOpen: isUserOpen(flag),
  });
}

export function isSystemOpen(flag: number): boolean {
  return flag === SYSTEM_OPEN_FLAG;
}

export function isUserOpen(flag: number): boolean {
  return flag === USER_OPEN_FLAG;
}

export function shouldDownload(path: string): boolean {
  const flag = fileFlags.get(path);

  if (!flag) {
    logger.debug({ msg: '[OpenFlagsTracker] No flag found, allowing download:', path });
    return true;
  }

  const extension = path.substring(path.lastIndexOf('.')).toLowerCase();
  if (DOWNLOAD_WHITELIST.has(extension)) {
    logger.debug({
      msg: '[OpenFlagsTracker] Extension whitelisted, allowing download:',
      path,
      extension,
      flag,
    });
    return true;
  }

  const shouldDownload = isUserOpen(flag);

  if (!shouldDownload) {
    logger.debug({
      msg: '[OpenFlagsTracker] Download blocked - system open detected:',
      path,
      flag,
    });
  }

  return shouldDownload;
}

export function onRelease(path: string): void {
  fileFlags.delete(path);
}
