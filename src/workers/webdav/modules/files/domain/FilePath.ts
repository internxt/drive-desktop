import path from 'path';
import { Path } from '../../shared/domain/Path';
import { WebdavFileValidator } from '../application/WebdavFileValidator';
import { InvalidArgumentError } from '../../../../shared/domain/InvalidArgumentError';

export class FilePath extends Path {
  private fileValidator = new WebdavFileValidator();

  constructor(value: string) {
    super(value);

    this.ensureIsValid(value);
  }

  private ensureIsValid(value: string) {
    const isValid = this.fileValidator.validateName(value);

    if (!isValid) {
      throw new InvalidArgumentError(`"${value}" is not a valid filename`);
    }
  }

  static fromParts(parts: Array<string>) {
    const full = path.join(...parts);

    return new FilePath(full);
  }

  extension(): string {
    const base = path.basename(this.value);
    const { ext } = path.parse(base);
    return ext.slice(1);
  }

  hasExtension(): boolean {
    const extension = this.extension();

    return extension !== '';
  }

  name(): string {
    const base = path.basename(this.value);
    const { name } = path.parse(base);
    return name;
  }

  nameWithExtension(): string {
    const basename = path.basename(this.value);
    const { base } = path.parse(basename);
    return base;
  }

  hasSameDirname(other: FilePath): boolean {
    return this.dirname() === other.dirname();
  }

  extensionMatch(extension: string): boolean {
    return this.extension() === extension;
  }

  hasSameExtension(other: FilePath): boolean {
    return this.extension() === other.extension();
  }

  changeFolder(folder: string): FilePath {
    return FilePath.fromParts([folder, this.name()]);
  }

  updateName(name: string): FilePath {
    return FilePath.fromParts([this.dirname(), name]);
  }
}
