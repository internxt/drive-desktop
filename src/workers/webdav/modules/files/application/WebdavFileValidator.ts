import { Path } from 'webdav-server/lib/index.v2';

export class WebdavFileValidator {
  validateName(path: Path): boolean {
    const filename = path.fileName();
    if (typeof filename === 'undefined' || !filename.length) return false;

    // On MacOS files that starts with ._ are generated
    if (filename.startsWith('._')) return false;

    return true;
  }
}
