import { SingleFileMatchingSearcher } from '../../../../../src/context/virtual-drive/files/application/SingleFileMatchingSearcher';
import {
  FileAttributes,
  File,
} from '../../../../../src/context/virtual-drive/files/domain/File';
import { FileRepository } from '../../../../../src/context/virtual-drive/files/domain/FileRepository';

export class SingleFileMatchingTestClass extends SingleFileMatchingSearcher {
  public readonly mock = jest.fn();

  constructor() {
    super(undefined as unknown as FileRepository);
  }

  run(attributes: Partial<FileAttributes>): Promise<File | undefined> {
    return this.mock(attributes);
  }
}
