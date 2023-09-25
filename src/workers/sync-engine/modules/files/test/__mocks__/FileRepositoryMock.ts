import { Nullable } from 'shared/types/Nullable';
import { FilePath } from '../../domain/FilePath';
import { File, FileAttributes } from '../../domain/File';
import { FileRepository } from '../../domain/FileRepository';

export class FileRepositoryMock implements FileRepository {
  public mockSearch = jest.fn();
  public mockSearchByCriteria = jest.fn();
  public mockDelete = jest.fn();
  public mockAdd = jest.fn();
  public mockUpdateName = jest.fn();
  public mockUpdateParentDir = jest.fn();
  public mockSearchOnFolder = jest.fn();

  search(pathLike: FilePath): Nullable<File> {
    return this.mockSearch(pathLike);
  }

  searchByPartial(partial: Partial<FileAttributes>): Nullable<File> {
    return this.mockSearchByCriteria(partial);
  }

  delete(file: File): Promise<void> {
    return this.mockDelete(file);
  }

  add(file: File): Promise<void> {
    return this.mockAdd(file);
  }

  updateName(item: File): Promise<void> {
    return this.mockUpdateName(item);
  }

  updateParentDir(item: File): Promise<void> {
    return this.mockUpdateParentDir(item);
  }

  searchOnFolder(folderId: number): Promise<Array<File>> {
    return this.mockSearchOnFolder(folderId);
  }

  clearMocks() {
    jest.clearAllMocks();
  }
}
