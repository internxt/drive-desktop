import { SingleFileMatchingFinder } from '../application/SingleFileMatchingFinder';
import { FileAttributes, File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';

export class SingleFileMatchingFinderTestClass extends SingleFileMatchingFinder {
  private readonly mock = vi.fn();

  constructor() {
    super({} as FileRepository);
  }

  run(partial: Partial<FileAttributes>): Promise<File> {
    return this.mock(partial);
  }

  finds(file: File) {
    this.mock.mockResolvedValueOnce(file);
  }
}
