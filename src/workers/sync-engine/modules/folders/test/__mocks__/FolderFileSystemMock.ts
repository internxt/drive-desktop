import { Folder } from '../../domain/Folder';
import { FolderInternxtFileSystem } from '../../domain/FolderInternxtFileSystem';
import { OfflineFolder } from '../../domain/OfflineFolder';

export class FolderInternxtFileSystemMock implements FolderInternxtFileSystem {
  public trashMock = jest.fn();
  public creteMock = jest.fn();
  public renameMock = jest.fn();
  public moveMock = jest.fn();

  async trash(entity: Folder): Promise<void> {
    return this.trashMock(entity);
  }
  async create(entity: OfflineFolder): Promise<Folder> {
    return this.creteMock(entity);
  }
  async rename(entity: Folder): Promise<void> {
    return this.renameMock(entity);
  }
  async move(entity: Folder): Promise<void> {
    return this.moveMock(entity);
  }
}
