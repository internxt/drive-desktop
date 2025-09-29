import path, { posix } from 'node:path';

export class PlatformPathConverter {
  static winToPosix(win: string): string {
    return win.split(path.win32.sep).join(path.posix.sep);
  }

  static posixToWin(posix: string): string {
    return posix.split(path.posix.sep).join(path.win32.sep);
  }

  static getFatherPathPosix(posixPath: string): string {
    let normalized = posix.normalize(posixPath);

    if (!normalized.startsWith('/')) {
      normalized = '/' + normalized;
    }

    const dirname = posix.dirname(normalized);

    return dirname === '.' ? '/' : dirname;
  }
}
