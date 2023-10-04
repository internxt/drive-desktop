import path from 'path';
import { Path } from '../../shared/domain/Path';
import { PlatformPathConverter } from '../../shared/test/helpers/PlatformPathConverter';

export class FolderPath extends Path {
  constructor(value: string) {
    super(value);
  }

  static fromParts(parts: Array<string>) {
    const full = path.posix.join(...parts);

    return new FolderPath(
      PlatformPathConverter.winToPosix(path.normalize(full))
    );
  }

  name(): string {
    if (this.value === path.sep) {
      return 'Internxt Drive';
    }

    return super.name();
  }

  updateName(name: string): FolderPath {
    return FolderPath.fromParts([this.dirname(), name]);
  }

  changeFolder(folder: string): FolderPath {
    return FolderPath.fromParts([folder, this.name()]);
  }
}
