import { Folder } from '../domain/Folder';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';

export class FuseLocalFileSystem implements LocalFileSystem {
  async createPlaceHolder(_folder: Folder): Promise<void> {
    //no-op
  }
}
