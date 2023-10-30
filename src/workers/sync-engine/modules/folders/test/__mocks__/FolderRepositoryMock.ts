import { Nullable } from 'shared/types/Nullable';
import { Folder, FolderAttributes } from '../../domain/Folder';
import { FolderRepository } from '../../domain/FolderRepository';

export class FolderRepositoryMock implements FolderRepository {
  public allMock = jest.fn();
  public searchByPartialMock = jest.fn();
  public addMock = jest.fn();
  public updateMock = jest.fn();
  public deleteMock = jest.fn();

  all(): Promise<Folder[]> {
    return this.allMock();
  }
  searchByPartial(
    partial: Partial<FolderAttributes>
  ): Promise<Nullable<Folder>> {
    return this.searchByPartialMock(partial);
  }
  add(folder: Folder): Promise<void> {
    return this.addMock(folder);
  }
  update(folder: Folder): Promise<void> {
    return this.updateMock(folder);
  }
  delete(folder: Folder): Promise<void> {
    return this.deleteMock(folder);
  }
}
