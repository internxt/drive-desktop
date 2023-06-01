import { FolderPath } from '../domain/FolderPath';
import { WebdavFolder } from '../domain/WebdavFolder';
import { WebdavFolderRepository } from '../domain/WebdavFolderRepository';
import { WebdavFolderFinder } from './WebdavFolderFinder';

export class WebdavFolderMover {
  constructor(
    private readonly repository: WebdavFolderRepository,
    private readonly folderFinder: WebdavFolderFinder
  ) {}

  private async rename(folder: WebdavFolder, path: FolderPath) {
    const renamedItem = folder.rename(path);

    await this.repository.updateName(renamedItem);
  }

  private async move(folder: WebdavFolder, parentFolder: WebdavFolder) {
    const moved = folder.moveTo(parentFolder);

    await this.repository.updateParentDir(moved);
  }

  async run(folder: WebdavFolder, to: string): Promise<void> {
    const destination = new FolderPath(to);
    const destinationFolder = this.repository.search(destination.value);

    const shouldBeMerge = destinationFolder !== undefined;

    if (shouldBeMerge) {
      throw new Error('Folders cannot be ovewriden');
    }

    const parentFolder = this.folderFinder.run(destination.dirname());

    if (folder.hasParent(parentFolder.id)) {
      await this.rename(folder, destination);
      return;
    }

    await this.move(folder, parentFolder);
  }
}
