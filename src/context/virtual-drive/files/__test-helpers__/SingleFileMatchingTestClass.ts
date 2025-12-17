import { SingleFileMatchingSearcher } from '../application/search/SingleFileMatchingSearcher';
import { FileAttributes, File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';

export class SingleFileMatchingTestClass extends SingleFileMatchingSearcher {
  public readonly mock = vi.fn();

  constructor() {
    super(undefined as unknown as FileRepository);
  }

  run(attributes: Partial<FileAttributes>): Promise<File | undefined> {
    return this.mock(attributes);
  }
}
