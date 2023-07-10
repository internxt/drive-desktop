import { Path } from 'webdav-server/lib/index.v2';

export class WebdavFileValidator {
  validateName(filename: string): boolean {
    if (typeof filename === 'undefined' || !filename.length) return false;

    // On MacOS files that starts with ._ are generated
    if (filename.startsWith('._')) return false;

    // Ignore DS_Store files
    if (filename === '.DS_Store') return false;

    return true;
  }

  validatePath(path: Path) {
    return this.validateName(path.fileName());
  }
}
