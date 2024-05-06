import { SingleFileMatchingFinder } from '../../../../../src/context/virtual-drive/files/application/SingleFileMatchingFinder';
import {
  FileAttributes,
  File,
} from '../../../../../src/context/virtual-drive/files/domain/File';
import { FileRepository } from '../../../../../src/context/virtual-drive/files/domain/FileRepository';

export class SingleFileMatchingFinderTestClass extends SingleFileMatchingFinder {
  private readonly mock = jest.fn();

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
