import { Path } from '../../../shared/domain/value-objects/Path';
import { ParentFolderFinder } from '../application/ParentFolderFinder';
import { FolderRepository } from '../domain/FolderRepository';

export class ParentFolderFinderTestClass extends ParentFolderFinder {
  constructor() {
    super({} as FolderRepository);
  }

  public mock = vi.fn();

  run(path: Path) {
    return this.mock(path);
  }
}
