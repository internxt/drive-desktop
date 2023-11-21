import { Folder } from '../Folder';

export interface LocalFileSystem {
  createPlaceHolder(folder: Folder): Promise<void>;
}
