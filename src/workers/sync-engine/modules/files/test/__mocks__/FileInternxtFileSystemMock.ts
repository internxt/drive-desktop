import { File, FileAttributes } from '../../domain/File';
import { FileInternxtFileSystem } from '../../domain/FileInternxtFileSystem';
import { OfflineFile } from '../../domain/OfflineFile';

export class FileInternxtFileSystemMock implements FileInternxtFileSystem {
  public readonly trashMock = jest.fn();
  public readonly createMock = jest.fn();
  public readonly renameMock = jest.fn();
  public readonly moveMock = jest.fn();

  trash(file: File): Promise<void> {
    return this.trashMock(file);
  }
  create(offlineFile: OfflineFile): Promise<FileAttributes> {
    return this.createMock(offlineFile);
  }
  rename(file: File): Promise<void> {
    return this.renameMock(file);
  }
  move(file: File): Promise<void> {
    return this.moveMock(file);
  }
}
