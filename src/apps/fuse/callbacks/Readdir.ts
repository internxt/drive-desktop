import Logger from 'electron-log';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { TypedCallback } from './Callback';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fuse = require('@gcas/fuse');

export class Readdir {
  constructor(private readonly container: VirtualDriveDependencyContainer) {}

  async execute(path: string, cb: TypedCallback<Array<string>>): Promise<void> {
    try {
      const files = await this.container.filesByFolderPathNameLister.run(path);

      const fileNames = files.map((file) => file.nameWithExtension);

      const folders = await this.container.foldersByParentPathSearcher.run(
        path
      );

      const foldersNames = folders.map((folder) => folder.name);

      cb(0, ['.', '..', ...fileNames, ...foldersNames]);
    } catch (error) {
      Logger.error('FUSE READDIR ', error);
      cb(fuse.ENOENT);
    }
  }
}
