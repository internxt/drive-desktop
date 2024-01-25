import path from 'path';
import { Path } from '../../../shared/domain/Path';

export class FolderPath extends Path {
  constructor(value: string) {
    super(value);
  }

  static fromParts(...parts: Array<string>) {
    const full = path.posix.join(...parts);

    return new FolderPath(path.posix.normalize(full));
  }

  name(): string {
    if (this.value === path.posix.sep) {
      return 'Internxt Drive';
    }

    return super.name();
  }

  basename(): string {
    return super.basename();
  }

  updateName(name: string): FolderPath {
    return FolderPath.fromParts(this.dirname(), name);
  }

  changeFolder(folder: string): FolderPath {
    return FolderPath.fromParts(folder, this.name());
  }
}
