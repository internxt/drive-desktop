import { FilesByPartialSearcher } from '../application/search/FilesByPartialSearcher';
import { FileAttributes, File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';

export class FilesByPartialSearcherTestClass extends FilesByPartialSearcher {
  private readonly mock = vi.fn();

  constructor() {
    super({} as FileRepository);
    this.mock.mockReturnValue([]);
  }

  run(partial: Partial<FileAttributes>): Promise<Array<File>> {
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
