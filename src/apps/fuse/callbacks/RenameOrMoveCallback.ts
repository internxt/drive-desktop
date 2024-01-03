import { File } from '../../../context/virtual-drive/files/domain/File';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { Folder } from '../../../context/virtual-drive/folders/domain/Folder';
import { NotifyFuseCallback } from './FuseCallback';
import { NoSuchFileOrDirectoryError } from './FuseErrors';

export class RenameOrMoveCallback extends NotifyFuseCallback {
  constructor(private readonly container: VirtualDriveDependencyContainer) {
    super('Rename Or Move');
  }

  private async findFile(path: string): Promise<File | undefined> {
    const file = await this.container.filesSearcher.run({ path });

    return file;
  }

  private async findFolder(path: string): Promise<Folder | undefined> {
    const folder = await this.container.folderSearcher.run({ path });

    return folder;
  }

  async execute(src: string, dest: string) {
    const file = await this.findFile(src);

    if (file) {
      await this.container.filePathUpdater.run(file.contentsId, dest);
      return this.right();
    }

    const folder = await this.findFolder(src);

    if (folder) {
      await this.container.folderPathUpdater.run(folder.uuid, dest);
      return this.right();
    }

    return this.left(
      new NoSuchFileOrDirectoryError(
        `File or folder not found when trying to change a path, src: ${src}, dest: ${dest}`
      )
    );
  }
}
