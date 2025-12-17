import { FoldersSearcherByPartial } from '../application/search/FoldersSearcherByPartial';
import { Folder, FolderAttributes } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';

export class FoldersSearcherByPartialTestClass extends FoldersSearcherByPartial {
  private readonly mock;

  constructor() {
    super({} as FolderRepository);
    this.mock = vi.fn();
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
