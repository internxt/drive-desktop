import { vi } from 'vitest';
import { Folder, FolderAttributes } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';

export class FolderRepositoryMock implements FolderRepository {
  public readonly allMock = vi.fn();
  public readonly matchingPartialMock = vi.fn();
  public readonly listByPartialMock = vi.fn();
  public readonly addMock = vi.fn();
  public readonly deleteMock = vi.fn();
  public readonly updateMock = vi.fn();
  public readonly searchByIdMock = vi.fn();
  public readonly searchByUuidMock = vi.fn();
  public readonly clearMock = vi.fn();

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

  clear(): Promise<void> {
    return this.clearMock();
  }
}
