import { ActionNotPermittedError } from '../domain/errors/ActionNotPermittedError';
import { FolderPath } from '../domain/FolderPath';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderFinder } from './FolderFinder';
import { WebdavFolderRenamer } from './WebdavFolderRenamer';

export class WebdavFolderMover {
  constructor(
    private readonly repository: FolderRepository,
    private readonly folderFinder: FolderFinder,
    private readonly folderRenamer: WebdavFolderRenamer
  ) {}

  private async move(folder: Folder, parentFolder: Folder) {
    folder.moveTo(parentFolder);

    await this.repository.updateParentDir(folder);
  }

  async run(folder: Folder, to: string): Promise<void> {
    const destination = new FolderPath(to);
    const resultFolder = this.repository.search(destination.value);

    const shouldBeMerge = resultFolder !== undefined;

    if (shouldBeMerge) {
      throw new ActionNotPermittedError('overwrite');
    }

    const destinationFolder = this.folderFinder.run(destination.dirname());

    if (folder.isIn(destinationFolder)) {
      await this.folderRenamer.run(folder, to);
      return;
    }

    await this.move(folder, destinationFolder);
  }
}
