import path from 'path';
import { Path } from '../../shared/domain/Path';

export class FolderPath extends Path {
  constructor(value: string) {
    super(value);
  }

  static fromParts(parts: Array<string>) {
    const full = path.join(...parts);

    return new FolderPath(full);
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
