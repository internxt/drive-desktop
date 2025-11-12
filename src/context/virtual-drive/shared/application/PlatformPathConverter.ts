import path from 'node:path';

export class PlatformPathConverter {
  static posixToWin(posix: string): string {
    return posix.split(path.posix.sep).join(path.win32.sep);
  }
}
