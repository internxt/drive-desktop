import { ContentsId } from '../../../../../src/context/virtual-drive/contents/domain/ContentsId';
import { LocalFileContents } from '../../../../../src/context/virtual-drive/contents/domain/LocalFileContents';
import { LocalFileSystem } from '../../../../../src/context/virtual-drive/contents/domain/LocalFileSystem';

export class LocalFileSystemMock implements LocalFileSystem {
  public writeMock = jest.fn();
  public removeMock = jest.fn();
  public existsMock = jest.fn();
  public metadataMock = jest.fn();
  public addMock = jest.fn();
  public listExistentFilesMock = jest.fn();

  write(contents: LocalFileContents): Promise<string> {
    return this.writeMock(contents);
  }

  remove(contentsId: ContentsId): Promise<void> {
    return this.removeMock(contentsId);
  }

  exists(contentId: ContentsId): Promise<boolean> {
    return this.existsMock(contentId);
  }

  metadata(contentsId: ContentsId) {
    return this.metadataMock(contentsId);
  }

  add(contentsId: ContentsId, source: string): Promise<void> {
    return this.addMock(contentsId, source);
  }

  listExistentFiles(): Promise<ContentsId[]> {
    return this.listExistentFilesMock();
  }
}
