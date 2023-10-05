import { File } from './File';

// TODO: Find a better name
export interface ManagedFileRepository {
  insert(file: File): Promise<void>;
  overwrite(oldFile: File, newFile: File): Promise<void>;
}
