import { LocalFileContents } from '../../domain/LocalFileContents';
import { LocalFileWriter } from '../../domain/LocalFileWriter';

export class LocalFileWriterMock implements LocalFileWriter {
  public writeMock = jest.fn();

  write(contents: LocalFileContents): Promise<string> {
    return this.writeMock(contents);
  }
}
