import { SingleFolderMatchingFinder } from '../application/SingleFolderMatchingFinder';
import { Folder, FolderAttributes } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';

export class SingleFolderMatchingFinderTestClass extends SingleFolderMatchingFinder {
  private readonly mock = vi.fn();

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
