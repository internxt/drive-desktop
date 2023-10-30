import { Nullable } from 'shared/types/Nullable';
import { FolderPath } from '../../domain/FolderPath';
import { Folder, FolderAttributes } from '../../domain/Folder';
import { FolderRepository } from '../../domain/FolderRepository';

export class FolderRepositoryMock implements FolderRepository {
  public mockSearch = jest.fn();
  public mockSearchByPartial = jest.fn();
  public mockAdd = jest.fn();
  public mockUpdateName = jest.fn();
  public mockUpdateParentDir = jest.fn();
  public mockCreate = jest.fn();
  public mockSearchOnFolder = jest.fn();
  public mockTrash = jest.fn();
  public mockClear = jest.fn();
  public mockAll = jest.fn();

  all(): Promise<Array<Folder>> {
    return this.mockAll();
  }

  search(pathLike: string): Nullable<Folder> {
    return this.mockSearch(pathLike);
  }

  searchByPartial(partial: Partial<FolderAttributes>): Nullable<Folder> {
    return this.mockSearchByPartial(partial);
  }

  add(file: Folder): Promise<void> {
    return this.mockAdd(file);
  }

  update(item: Folder): Promise<void> {
    return this.mockUpdateName(item);
  }

  updateParentDir(item: Folder): Promise<void> {
    return this.mockUpdateParentDir(item);
  }

  add(
    name: FolderPath,
    parentId: number | null,
    uuid: Folder['uuid']
  ): Promise<Folder> {
    return this.mockCreate(name, parentId, uuid);
  }

  searchOn(folder: Folder): Promise<Folder[]> {
    return this.mockSearchOnFolder(folder);
  }

  delete(folder: Folder): Promise<void> {
    return this.mockTrash(folder);
  }

  clear(): void {
    return this.mockClear();
  }

  clearMocks() {
    jest.clearAllMocks();
  }
}
