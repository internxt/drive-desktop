import { FoldersSearcherByPartial } from '../../../../../../src/context/virtual-drive/folders/application/search/FoldersSearcherByPartial';
import { FolderAttributes, Folder } from '../../../../../../src/context/virtual-drive/folders/domain/Folder';
import { FolderRepository } from '../../../../../../src/context/virtual-drive/folders/domain/FolderRepository';

export class FoldersSearcherByPartialTestClass extends FoldersSearcherByPartial {
  private readonly mock;

  constructor() {
    super({} as FolderRepository);
    this.mock = jest.fn();
  }

  run(partial: Partial<FolderAttributes>): Promise<Folder[]> {
    return this.mock(partial);
  }

  findsOnce(folders: Array<Folder>) {
    this.mock.mockReturnValueOnce(folders);
  }

  doesNotFindAny() {
    this.mock.mockReturnValue([]);
  }

  assertHasBeenCalledTimes(times: number): void {
    expect(this.mock).toBeCalledTimes(times);
  }
}
