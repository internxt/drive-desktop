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

  search(pathLike: string): Nullable<Folder> {
    return this.mockSearch(pathLike);
  }

  searchByPartial(partial: Partial<FolderAttributes>): Nullable<Folder> {
    return this.mockSearchByPartial(partial);
  }

  add(file: Folder): Promise<void> {
    return this.mockAdd(file);
  }

  updateName(item: Folder): Promise<void> {
    return this.mockUpdateName(item);
  }

  updateParentDir(item: Folder): Promise<void> {
    return this.mockUpdateParentDir(item);
  }

  create(name: FolderPath, parentId: number | null): Promise<Folder> {
    return this.mockCreate(name, parentId);
  }

  searchOn(folder: Folder): Promise<Folder[]> {
    return this.mockSearchOnFolder(folder);
  }

  trash(folder: Folder): Promise<void> {
    return this.mockTrash(folder);
  }

  clearMocks() {
    jest.clearAllMocks();
  }
}
