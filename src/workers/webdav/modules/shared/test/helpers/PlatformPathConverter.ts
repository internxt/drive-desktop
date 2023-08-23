import path from 'path';

export class PlatformPathConverter {
  static convertAnyToCurrent(anyPlatformPath: string): string {
    const fromPlatform = anyPlatformPath.includes(path.posix.sep)
      ? path.posix
      : path.win32;

    const toPlatform = path.sep === path.posix.sep ? path.posix : path.win32;

    return anyPlatformPath.split(fromPlatform.sep).join(toPlatform.sep);
  }
}
