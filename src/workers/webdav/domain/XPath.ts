import path from 'path';
import { InvalidArgumentError } from '../../shared/domain/InvalidArgumentError';
import { ValueObject } from '../../shared/domain/ValueObject';

export class XPath extends ValueObject<string> {
  constructor(value: string) {
    super(value);
    this.startsWithSlash(value);
  }

  private startsWithSlash(value: string) {
    if (!value.startsWith('/')) {
      throw new InvalidArgumentError(`${value} is not a valid XPath`);
    }
  }

  static fromParts(parts: Array<string>) {
    const full = path.join(...parts);

    return new XPath(full);
  }

  extension(): string {
    const base = path.basename(this.value);
    const { ext } = path.parse(base);
    return ext.slice(1);
  }

  name(): string {
    const base = path.basename(this.value);
    const { name } = path.parse(base);
    return name;
  }

  dirname(): string {
    return path.dirname(this.value);
  }

  hasSameName(other: XPath) {
    const name = this.name();
    const otherName = other.name();

    return name === otherName;
  }

  hasSameDirname(other: XPath): boolean {
    const dirname = path.dirname(this.value);
    const otherDirname = path.dirname(other.value);

    return dirname === otherDirname;
  }
}
