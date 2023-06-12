import { ActionNotPermitedError } from '../domain/errors/ActionNotPermitedError';
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
    folder.rename(path);

    await this.repository.updateName(folder);
  }

  private async move(folder: WebdavFolder, parentFolder: WebdavFolder) {
    folder.moveTo(parentFolder);

    await this.repository.updateParentDir(folder);
  }

  async run(folder: WebdavFolder, to: string): Promise<void> {
    const destination = new FolderPath(to);
    const resultFolder = this.repository.search(destination.value);

    const shouldBeMerge = resultFolder !== undefined;

    if (shouldBeMerge) {
      throw new ActionNotPermitedError('overwrite');
    }

    const destinationFolder = this.folderFinder.run(destination.dirname());

    if (folder.isIn(destinationFolder)) {
      await this.rename(folder, destination);
      return;
    }

    await this.move(folder, destinationFolder);
  }
}
