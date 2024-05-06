import { FilesByPartialSearcher } from '../../../../../../src/context/virtual-drive/files/application/search/FilesByPartialSearcher';
import {
  FileAttributes,
  File,
} from '../../../../../../src/context/virtual-drive/files/domain/File';
import { FileRepository } from '../../../../../../src/context/virtual-drive/files/domain/FileRepository';

export class FilesByPartialSearcherTestClass extends FilesByPartialSearcher {
  private readonly mock = jest.fn();

  constructor() {
    super({} as FileRepository);
    this.mock.mockReturnValue([]);
  }

  run(partial: Partial<FileAttributes>): Promise<File[]> {
    return this.mock(partial);
  }

  findsOnce(files: Array<File>) {
    this.mock.mockResolvedValueOnce(files);
  }

  finds(files: Array<File>) {
    this.mock.mockReturnValue(files);
  }

  doesNotFindAny() {
    this.finds([]);
  }

  assertHasBeenCalledWith(values: Array<Partial<FileAttributes>>) {
    expect(this.mock).toBeCalledTimes(values.length);

    values.forEach((value, index) => {
      expect(this.mock).nthCalledWith(index + 1, value);
    });
  }
}
