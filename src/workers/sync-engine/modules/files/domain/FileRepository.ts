import { File, FileAttributes } from './File';
import { Nullable } from '../../../../../shared/types/Nullable';

export interface FileRepository {
  all(): Promise<Array<File>>;

  searchByPartial(partial: Partial<FileAttributes>): Promise<Nullable<File>>;

  delete(file: File): Promise<void>;

  add(file: File): Promise<void>;

  update(item: File): Promise<void>;
}
