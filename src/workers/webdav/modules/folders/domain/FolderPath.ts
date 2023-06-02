import path from 'path';
import { InvalidArgumentError } from '../../../../shared/domain/InvalidArgumentError';
import { WebdavPath } from '../../shared/domain/WebdavPath';

export class FolderPath extends WebdavPath {
  constructor(value: string) {
    super(value);
    this.startsWithSlash(value);
  }

  private startsWithSlash(value: string) {
    if (!value.startsWith('/')) {
      throw new InvalidArgumentError(`${value} is not a valid FolderPath`);
    }
  }

  static fromParts(parts: Array<string>) {
    const full = path.join(...parts);

    return new FolderPath(full);
  }
}
