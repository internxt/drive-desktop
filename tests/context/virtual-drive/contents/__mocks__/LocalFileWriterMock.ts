import { LocalFileContents } from '../../../../../src/context/virtual-drive/contents/domain/LocalFileContents';
import { LocalFileWriter } from '../../../../../src/context/virtual-drive/contents/domain/LocalFileWriter';

export class LocalFileWriterMock implements LocalFileWriter {
  public writeMock = jest.fn();

  write(contents: LocalFileContents): Promise<string> {
    return this.writeMock(contents);
  }
}
