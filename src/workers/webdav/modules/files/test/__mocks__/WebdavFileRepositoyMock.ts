import { Nullable } from 'shared/types/Nullable';
import { FilePath } from '../../domain/FilePath';
import { WebdavFile } from '../../domain/WebdavFile';
import { WebdavFileRepository } from '../../domain/WebdavFileRepository';

export class WebdavFileRepositoryMock implements WebdavFileRepository {
  public mockSearch = jest.fn();
  public mockDelete = jest.fn();
  public mockAdd = jest.fn();
  public mockUpdateName = jest.fn();
  public mockUpdateParentDir = jest.fn();
  public mockSearchOnFolder = jest.fn();

  search(pathLike: FilePath): Nullable<WebdavFile> {
    return this.mockSearch(pathLike);
  }
  delete(file: WebdavFile): Promise<void> {
    return this.mockDelete(file);
  }

  add(file: WebdavFile): Promise<void> {
    return this.mockAdd(file);
  }

  updateName(item: WebdavFile): Promise<void> {
    return this.mockUpdateName(item);
  }

  updateParentDir(item: WebdavFile): Promise<void> {
    return this.mockUpdateParentDir(item);
  }

  searchOnFolder(folderId: number): Promise<Array<WebdavFile>> {
    return this.mockSearchOnFolder(folderId);
  }

  clearMocks() {
    jest.clearAllMocks();
  }
}
