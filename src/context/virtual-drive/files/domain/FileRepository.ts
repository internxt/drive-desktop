import { File, FileAttributes } from './File';

export interface FileRepository {
  all(): Promise<Array<File>>;

  searchByPartial(partial: Partial<FileAttributes>): File | undefined;

  delete(id: File['contentsId']): Promise<void>;

  add(file: File): Promise<void>;

  update(file: File, oldContentsId?: File['contentsId']): Promise<void>;
}
