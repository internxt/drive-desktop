import path from 'path';
import { ValueObject } from '../../../../shared/domain/ValueObject';

export abstract class Path extends ValueObject<string> {
  private convertPathToCurrentPlatform(p: string) {
    const fromPlatform = p.includes(path.posix.sep) ? path.posix : path.win32;

    const toPlatform = path.sep === path.posix.sep ? path.posix : path.win32;

    return p.split(fromPlatform.sep).join(toPlatform.sep);
  }

  private convertPathToPosix(p: string) {
    return p.split(path.win32.sep).join(path.posix.sep);
  }

  name(): string {
    const base = path.basename(this.value);
    const { name } = path.parse(base);
    return name;
  }

  dirname(): string {
    const dirname = this.convertPathToCurrentPlatform(path.dirname(this.value));
    if (dirname === '.') {
      return path.sep;
    }

    return dirname;
  }

  posixDirname(): string {
    return this.convertPathToPosix(path.dirname(this.value));
  }

  hasSameName(other: Path) {
    const name = this.name();
    const otherName = other.name();

    return name === otherName;
  }
}
