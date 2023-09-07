import { File } from './File';
import { Nullable } from '../../../../../shared/types/Nullable';

export interface FileRepository {
  searchByUuid(uuid: string): Promise<Nullable<File>>;

  delete(file: File): Promise<void>;

  add(file: File): Promise<void>;

  updateName(item: File): Promise<void>;

  updateParentDir(item: File): Promise<void>;
}
