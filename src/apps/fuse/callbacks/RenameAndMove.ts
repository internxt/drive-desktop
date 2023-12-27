import { File } from '../../../context/virtual-drive/files/domain/File';
import { DependencyContainer } from '../dependency-injection/DependencyContainer';
import { Folder } from '../../../context/virtual-drive/folders/domain/Folder';
import { Callback } from './Callback';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fuse = require('@gcas/fuse');

export class RenameOrMove {
  constructor(private readonly container: DependencyContainer) {}

  private async findFile(path: string): Promise<File | undefined> {
    const file = await this.container.filesSearcher.run({ path });

    return file;
  }

  private async findFolder(path: string): Promise<Folder | undefined> {
    const folder = await this.container.folderSearcher.run({ path });

    return folder;
  }

  async execute(src: string, dest: string, cb: Callback) {
    const file = await this.findFile(src);

    if (file) {
      await this.container.filePathUpdater.run(file.contentsId, dest);
      return cb(0);
    }

    const folder = await this.findFolder(src);

    if (folder) {
      await this.container.folderPathUpdater.run(folder.uuid, dest);
      return cb(0);
    }

    return cb(fuse.ENOENT);
  }
}
