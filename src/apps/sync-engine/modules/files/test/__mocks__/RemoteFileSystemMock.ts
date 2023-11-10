import { FileAttributes, File } from '../../domain/File';
import { OfflineFile } from '../../domain/OfflineFile';
import { RemoteFileSystem } from '../../domain/file-systems/RemoteFileSystem';

export class RemoteFileSystemMock implements RemoteFileSystem {
  public readonly persistMock = jest.fn();
  public readonly trashMock = jest.fn();
  public readonly moveMock = jest.fn();
  public readonly renameMock = jest.fn();

  persist(offline: OfflineFile): Promise<FileAttributes> {
    return this.persistMock(offline);
  }

  trash(contentsId: string): Promise<void> {
    return this.trashMock(contentsId);
  }

  move(file: File): Promise<void> {
    return this.moveMock(file);
  }

  rename(file: File): Promise<void> {
    return this.renameMock(file);
  }
}
