import { Nullable } from 'shared/types/Nullable';
import { FilePath } from '../../domain/FilePath';
import { File, FileAttributes } from '../../domain/File';
import { FileRepository } from '../../domain/FileRepository';

export class FileRepositoryMock implements FileRepository {
  public mockSearch = jest.fn();
  public mockSearchByPartial = jest.fn();
  public mockDelete = jest.fn();
  public mockAdd = jest.fn();
  public mockUpdate = jest.fn();
  public mockAll = jest.fn();

  all(): Promise<Array<File>> {
    return this.mockAll();
  }

  search(pathLike: FilePath): Nullable<File> {
    return this.mockSearch(pathLike);
  }

  searchByPartial(partial: Partial<FileAttributes>): Promise<Nullable<File>> {
    return this.mockSearchByPartial(partial);
  }

  delete(file: File): Promise<void> {
    return this.mockDelete(file);
  }

  add(file: File): Promise<void> {
    return this.mockAdd(file);
  }

  update(item: File): Promise<void> {
    return this.mockUpdate(item);
  }

  clearMocks() {
    jest.clearAllMocks();
  }
}
