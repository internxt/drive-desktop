import { FolderFinder } from '../../../../../src/context/virtual-drive/folders/application/FolderFinder';
import { FolderRepository } from '../../../../../src/context/virtual-drive/folders/domain/FolderRepository';

export class FolderFinderTestClass extends FolderFinder {
  constructor() {
    super({} as FolderRepository);
  }

  public mock = jest.fn();

  run(path: string) {
    return this.mock(path);
  }
}
