import {
  Folder,
  FolderAttributes,
} from '../../../../../src/context/virtual-drive/folders/domain/Folder';
import { FolderRepository } from '../../../../../src/context/virtual-drive/folders/domain/FolderRepository';

export class FolderRepositoryMock implements FolderRepository {
  public readonly allMock = jest.fn();
  public readonly matchingPartialMock = jest.fn();
  public readonly listByPartialMock = jest.fn();
  public readonly addMock = jest.fn();
  public readonly deleteMock = jest.fn();
  public readonly updateMock = jest.fn();
  public readonly searchByIdMock = jest.fn();
  public readonly searchByUuidMock = jest.fn();

  all(): Promise<Folder[]> {
    return this.allMock();
  }

  searchById(id: number): Promise<Folder | undefined> {
    return this.searchByIdMock(id);
  }

  searchByUuid(id: string): Promise<Folder | undefined> {
    return this.searchByUuidMock(id);
  }

  matchingPartial(partial: Partial<FolderAttributes>): Array<Folder> {
    return this.matchingPartialMock(partial);
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
