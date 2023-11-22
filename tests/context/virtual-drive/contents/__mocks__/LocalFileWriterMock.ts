import { LocalFileContents } from '../../../../../src/context/virtual-drive/contents/domain/LocalFileContents';
import { LocalFileSystem } from '../../../../../src/context/virtual-drive/contents/domain/LocalFileSystem';

export class LocalFileWriterMock implements LocalFileSystem {
  public writeMock = jest.fn();

  write(contents: LocalFileContents): Promise<string> {
    return this.writeMock(contents);
  }
}
