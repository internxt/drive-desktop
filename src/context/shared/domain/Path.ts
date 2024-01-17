import path from 'path';
import { InvalidArgumentError } from './InvalidArgumentError';
import { ValueObject } from './value-objects/ValueObject';

const isWindowsRootDirectory = /[a-zA-Z]:[\\/]/;
const containsNullCharacter = /\0/g;

export abstract class Path extends ValueObject<string> {
  private static readonly maliciousPathValidations = [
    (name: string) => name.includes('../'),
    (name: string) => name.startsWith('..'),
    (name: string) => isWindowsRootDirectory.test(name),
    (name: string) => containsNullCharacter.test(name),
  ];

  constructor(value: string) {
    super(value);

    this.ensurePathIsPosix(value);
    this.ensurePathIsNotMalicious(value);
  }

  private ensurePathIsNotMalicious(value: string) {
    const isMalicious = Path.maliciousPathValidations.some((validation) =>
      validation(value)
    );

    if (isMalicious) {
      throw new InvalidArgumentError(`Path ${value} might be malicious.`);
    }
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

  basename(): string {
    return path.posix.basename(this.value);
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
