import { LocalFileContents } from '../../../../../src/context/virtual-drive/contents/domain/LocalFileContents';
import { LocalFileSystem } from '../../../../../src/context/virtual-drive/contents/domain/LocalFileSystem';

export class LocalFileSystemMock implements LocalFileSystem {
  public writeMock = jest.fn();
  public removeMock = jest.fn();
  public existsMock = jest.fn();

  write(contents: LocalFileContents): Promise<string> {
    return this.writeMock(contents);
  }
  remove(path: string): Promise<void> {
    return this.removeMock(path);
  }
  exists(path: string): Promise<boolean> {
    return this.existsMock(path);
  }
}
