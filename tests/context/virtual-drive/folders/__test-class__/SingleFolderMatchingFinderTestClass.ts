import { SingleFolderMatchingFinder } from '../../../../../src/context/virtual-drive/folders/application/SingleFolderMatchingFinder';
import {
  Folder,
  FolderAttributes,
} from '../../../../../src/context/virtual-drive/folders/domain/Folder';
import { FolderRepository } from '../../../../../src/context/virtual-drive/folders/domain/FolderRepository';

export class SingleFolderMatchingFinderTestClass extends SingleFolderMatchingFinder {
  private readonly mock = jest.fn();

  constructor() {
    super({} as FolderRepository);
  }

  async run(partial: Partial<FolderAttributes>) {
    return this.mock(partial);
  }

  finds(folders: Folder | Array<Folder>): void {
    if (Array.isArray(folders)) {
      folders.forEach((folder) => {
        this.mock.mockReturnValueOnce(folder);
      });

      return;
    }

    this.mock.mockReturnValueOnce(folders);
  }
}
