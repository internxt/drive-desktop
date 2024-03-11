import { Path } from '../../../../../src/context/shared/domain/value-objects/Path';
import { ParentFolderFinder } from '../../../../../src/context/virtual-drive/folders/application/ParentFolderFinder';
import { FolderRepository } from '../../../../../src/context/virtual-drive/folders/domain/FolderRepository';

export class ParentFolderFinderTestClass extends ParentFolderFinder {
  constructor() {
    super({} as FolderRepository);
  }

  public mock = jest.fn();

  run(path: Path) {
    return this.mock(path);
  }
}
