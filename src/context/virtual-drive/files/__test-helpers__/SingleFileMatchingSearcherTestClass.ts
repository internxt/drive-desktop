import { SingleFileMatchingSearcher } from '../application/search/SingleFileMatchingSearcher';
import { FileAttributes, File } from '../domain/File';
import { FileRepositoryMock } from '../__mocks__/FileRepositoryMock';

export class SingleFileMatchingSearcherTestClass extends SingleFileMatchingSearcher {
  private mock = vi.fn().mockReturnThis();

  constructor() {
    const repository = new FileRepositoryMock();

    super(repository);
  }

  async run(attributes: Partial<FileAttributes>): Promise<File | undefined> {
    return this.mock(attributes);
  }

  returnOnce(value: File | undefined): void {
    this.mock.mockReturnValueOnce(value);
  }

  returnAlways(value: File | undefined): void {
    this.mock.mockResolvedValue(value);
  }

  returnOneAtATime(files: Array<File | undefined>) {
    files.forEach((file) => this.mock.mockResolvedValueOnce(file));
  }

  assertHasBeenSearchedWith(calls: Array<Partial<FileAttributes>>) {
    calls.forEach((parameters) => expect(this.mock).toBeCalledWith(parameters));
  }

  assertHasBeenCalledTimes(times: number) {
    expect(this.mock).toBeCalledTimes(times);
  }
}
