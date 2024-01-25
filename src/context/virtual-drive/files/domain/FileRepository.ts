import { File, FileAttributes } from './File';

export interface FileRepository {
  all(): Promise<Array<File>>;

  searchByPartial(partial: Partial<FileAttributes>): File | undefined;

  listByPartial(partial: Partial<FileAttributes>): Promise<Array<File>>;

  delete(id: File['contentsId']): Promise<void>;

  add(file: File): Promise<void>;

  update(file: File): Promise<void>;
}
