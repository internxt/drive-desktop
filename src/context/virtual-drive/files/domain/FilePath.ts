import path from 'path';
import { Path } from '../../../shared/domain/value-objects/Path';
import { thumbnableExtensions } from '../../../../apps/main/thumbnails/domain/ThumbnableExtension';
import MimeTypesMap, { MimeType } from './MimeTypesMap';

export class FilePath extends Path {
  constructor(value: string) {
    super(value);
  }

  static fromParts(parts: Array<string>) {
    const full = path.posix.join(...parts);

    return new FilePath(full);
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
    return FilePath.fromParts([folder, this.nameWithExtension()]);
  }

  updateName(name: string): FilePath {
    return FilePath.fromParts([this.dirname(), name]);
  }

  isThumbnable(): boolean {
    if (!this.hasExtension()) {
      return false;
    }

    return thumbnableExtensions.includes(this.extension());
  }

  mimeType(): MimeType {
    const extension = `.${this.extension()}`;

    const mimeType = MimeTypesMap[extension];

    if (!mimeType) {
      return 'application/octet-stream';
    }

    return mimeType;
  }
}
