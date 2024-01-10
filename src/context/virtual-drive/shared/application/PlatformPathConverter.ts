import path from 'path';

export class PlatformPathConverter {
  static convertAnyToCurrent(anyPlatformPath: string): string {
    const fromPlatform = anyPlatformPath.includes(path.posix.sep)
      ? path.posix
      : path.win32;

    const toPlatform = path.sep === path.posix.sep ? path.posix : path.win32;

    return anyPlatformPath.split(fromPlatform.sep).join(toPlatform.sep);
  }

  static winToPosix(win: string): string {
    return win.split(path.win32.sep).join(path.posix.sep);
  }

  static posixToWin(posix: string): string {
    return posix.split(path.posix.sep).join(path.win32.sep);
  }

  static getFatherPathPosix(posixPath: string): string {
    const pathArray = posixPath.split('/');
    pathArray.pop();
    const parentPath = pathArray.join('/');
    return this.winToPosix(parentPath);
  }
}
