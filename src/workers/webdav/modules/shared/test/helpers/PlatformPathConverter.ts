import path from 'path';

export class PlatformPathConverter {
  static convertAnyToCurrent(anyPlatformPath: string) {
    const isPosix = anyPlatformPath.includes(path.posix.sep);

    if (isPosix) {
      return anyPlatformPath.split(path.posix.sep).join(path.win32.sep);
    }

    return anyPlatformPath.split(path.win32.sep).join(path.posix.sep);
  }
}
