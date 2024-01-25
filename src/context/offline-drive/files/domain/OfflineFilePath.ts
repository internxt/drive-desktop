import path from 'path';
import { Path } from '../../../shared/domain/Path';

export class OfflineFilePath extends Path {
  constructor(value: string) {
    super(value);
  }

  static fromParts(parts: Array<string>) {
    const full = path.posix.join(...parts);

    return new OfflineFilePath(full);
  }

  extension(): string {
    const base = path.posix.basename(this.value);
    const { ext } = path.posix.parse(base);
    return ext.slice(1);
  }

  hasExtension(): boolean {
    const extension = this.extension();

    return extension !== '';
  }

  name(): string {
    const base = path.posix.basename(this.value);
    const { name } = path.posix.parse(base);
    return name;
  }

  nameWithExtension(): string {
    const basename = path.posix.basename(this.value);
    const { base } = path.posix.parse(basename);
    return base;
  }

  hasSameDirname(other: OfflineFilePath): boolean {
    return this.dirname() === other.dirname();
  }

  extensionMatch(extension: string): boolean {
    return this.extension() === extension;
  }

  hasSameExtension(other: OfflineFilePath): boolean {
    return this.extension() === other.extension();
  }

  changeFolder(folder: string): OfflineFilePath {
    return OfflineFilePath.fromParts([folder, this.nameWithExtension()]);
  }

  updateName(name: string): OfflineFilePath {
    return OfflineFilePath.fromParts([this.dirname(), name]);
  }
}
