import path from 'path';

export class PlatformPathConverter {
  static convertAnyToCurrent(anyPlatform: string): string {
    const fromPlatform = anyPlatform.includes(path.posix.sep)
      ? path.posix
      : path.win32;

    const toPlatform = path.sep === path.posix.sep ? path.posix : path.win32;

    return anyPlatform.split(fromPlatform.sep).join(toPlatform.sep);
  }
}
