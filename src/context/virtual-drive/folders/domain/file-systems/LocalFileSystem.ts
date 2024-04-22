import { Folder } from '../Folder';

export abstract class LocalFileSystem {
  abstract createPlaceHolder(folder: Folder): Promise<void>;
}
