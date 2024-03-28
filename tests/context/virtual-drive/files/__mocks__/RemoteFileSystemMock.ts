import {
  File,
  FileAttributes,
} from '../../../../../src/context/virtual-drive/files/domain/File';
import { OfflineFile } from '../../../../../src/context/virtual-drive/files/domain/OfflineFile';
import { RemoteFileSystem } from '../../../../../src/context/virtual-drive/files/domain/file-systems/RemoteFileSystem';

export class RemoteFileSystemMock implements RemoteFileSystem {
  public readonly persistMock = jest.fn();
  public readonly trashMock = jest.fn();
  public readonly moveMock = jest.fn();
  public readonly renameMock = jest.fn();
  public readonly overrideMock = jest.fn();

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

  override(file: File): Promise<void> {
    return this.overrideMock(file);
  }
}
