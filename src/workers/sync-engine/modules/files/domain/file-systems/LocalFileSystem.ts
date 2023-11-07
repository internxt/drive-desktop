import { File } from '../File';

export interface LocalFileSystem {
  createPlaceHolder(file: File): Promise<void>;
}
