import {
  Folder,
  FolderAttributes,
} from '../../../../../src/context/virtual-drive/folders/domain/Folder';
import { FolderRepository } from '../../../../../src/context/virtual-drive/folders/domain/FolderRepository';

export class FolderRepositoryMock implements FolderRepository {
  public readonly allMock = jest.fn();
  public readonly searchByPartialMock = jest.fn();
  public readonly listByPartialMock = jest.fn();
  public readonly addMock = jest.fn();
  public readonly deleteMock = jest.fn();
  public readonly updateMock = jest.fn();

  all(): Promise<Folder[]> {
    return this.allMock();
  }

  searchByPartial(partial: Partial<FolderAttributes>): Folder | undefined {
    return this.searchByPartialMock(partial);
  }

  listByPartial(partial: Partial<FolderAttributes>): Promise<Array<Folder>> {
    return this.listByPartialMock(partial);
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
