import { Nullable } from 'shared/types/Nullable';
import { FolderPath } from '../../domain/FolderPath';
import { WebdavFolder } from '../../domain/WebdavFolder';
import { WebdavFolderRepository } from '../../domain/WebdavFolderRepository';

export class WebdavFolderRepositoryMock implements WebdavFolderRepository {
  public mockSearch = jest.fn();
  public mockAdd = jest.fn();
  public mockUpdateName = jest.fn();
  public mockUpdateParentDir = jest.fn();
  public mockCreate = jest.fn();
  public mockSearchOnFolder = jest.fn();
  public mockTrash = jest.fn();

  search(pathLike: string): Nullable<WebdavFolder> {
    return this.mockSearch(pathLike);
  }

  add(file: WebdavFolder): Promise<void> {
    return this.mockAdd(file);
  }

  updateName(item: WebdavFolder): Promise<void> {
    return this.mockUpdateName(item);
  }

  updateParentDir(item: WebdavFolder): Promise<void> {
    return this.mockUpdateParentDir(item);
  }

  create(name: FolderPath, parentId: number | null): Promise<WebdavFolder> {
    return this.mockCreate(name, parentId);
  }

  searchOnFolder(folder: number): WebdavFolder[] {
    return this.mockSearchOnFolder(folder);
  }

  trash(folder: WebdavFolder): Promise<void> {
    return this.mockTrash(folder);
  }

  clearMocks() {
    jest.clearAllMocks();
  }
}
