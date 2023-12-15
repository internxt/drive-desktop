import { Folder } from '../Folder';

export interface LocalFolderSystem {
  createPlaceHolder(folder: Folder): Promise<void>;
}
