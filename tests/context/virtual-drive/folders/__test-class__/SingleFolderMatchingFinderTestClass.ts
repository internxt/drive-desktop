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

  finds(
    values: Array<{ partial: Partial<FolderAttributes>; folder: Folder }>
  ): void {
    values.forEach(({ partial, folder }) => {
      this.mock(partial);
      this.mock.mockReturnValueOnce(folder);
    });
  }
}
