import { Nullable } from 'shared/types/Nullable';
import { Folder, FolderAttributes } from '../../domain/Folder';
import { FolderRepository } from '../../domain/FolderRepository';

export class FolderRepositoryMock implements FolderRepository {
  public readonly allMock = jest.fn();
  public readonly searchByPartialMock = jest.fn();
  public readonly addMock = jest.fn();
  public readonly deleteMock = jest.fn();
  public readonly updateMock = jest.fn();

  all(): Promise<Folder[]> {
    return this.allMock();
  }

  searchByPartial(partial: Partial<FolderAttributes>): Nullable<Folder> {
    return this.searchByPartialMock(partial);
  }

  add(folder: Folder): Promise<void> {
    return this.addMock(folder);
  }

  delete(id: number): Promise<void> {
    return this.deleteMock(id);
  }

  update(folder: Folder): Promise<void> {
    return this.updateMock(folder);
  }
}
