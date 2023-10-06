import path from 'path';
import { ValueObject } from '../../../../shared/domain/ValueObject';
import { InvalidArgumentError } from '../../../../shared/domain/InvalidArgumentError';

export abstract class Path extends ValueObject<string> {
  constructor(value: string) {
    super(value);

    this.ensurePathIsPosix(value);
  }

  private ensurePathIsPosix(value: string) {
    const isPosix = value.indexOf('/') !== -1;

    if (!isPosix) {
      throw new InvalidArgumentError(`Paths have to be posix, path: ${value}`);
    }
  }

  name(): string {
    const base = path.posix.basename(this.value);
    const { name } = path.posix.parse(base);
    return name;
  }

  dirname(): string {
    const dirname = path.posix.dirname(this.value);
    if (dirname === '.') {
      return path.posix.sep;
    }

    return dirname;
  }

  hasSameName(other: Path) {
    const name = this.name();
    const otherName = other.name();

    return name === otherName;
  }
}
