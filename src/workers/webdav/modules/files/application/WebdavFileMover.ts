import { WebdavFolder } from '../../folders/domain/WebdavFolder';
import { WebdavFolderFinder } from '../../folders/application/WebdavFolderFinder';
import { FilePath } from '../domain/FilePath';
import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';
import { FileAlreadyExistsError } from '../domain/errors/FileAlreadyExistsError';
import { UnknownFileActionError } from '../domain/errors/UnknownFileActionError';
import { ActionNotPermitedError } from '../domain/errors/ActionNotPermitedError';

export class WebdavFileMover {
  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly folderFinder: WebdavFolderFinder
  ) {}

  private async rename(file: WebdavFile, path: FilePath) {
    const renamed = file.rename(path);
    return await this.repository.updateName(renamed);
  }

  private async move(file: WebdavFile, folder: WebdavFolder) {
    const moved = file.moveTo(folder);
    await this.repository.updateParentDir(moved);
  }

  private async overwite(
    file: WebdavFile,
    destinationFile: WebdavFile,
    folder: WebdavFolder
  ) {
    const moved = file.moveTo(folder);

    await this.repository.delete(destinationFile);
    await this.repository.updateParentDir(moved);
  }

  private noMoreActionsLeft(overwite: never) {
    if (overwite) throw new UnknownFileActionError('WebdavFileMover');
  }

  async run(
    file: WebdavFile,
    to: string,
    overwrite: boolean
  ): Promise<boolean> {
    const destination = new FilePath(to);
    const destinationFile = this.repository.search(destination.value);

    const hasToBeOverwritten =
      destinationFile !== undefined && destinationFile !== null;

    if (hasToBeOverwritten && !overwrite) {
      throw new FileAlreadyExistsError(to);
    }

    const destinationFolder = this.folderFinder.run(destination.dirname());

    if (file.hasParent(destinationFolder.id)) {
      if (hasToBeOverwritten) {
        throw new ActionNotPermitedError('overwrite');
      }

      await this.rename(file, destination);
      return false;
    }

    if (!hasToBeOverwritten) {
      await this.move(file, destinationFolder);
      return false;
    }

    if (hasToBeOverwritten) {
      await this.overwite(file, destinationFile, destinationFolder);
      return true;
    }

    this.noMoreActionsLeft(hasToBeOverwritten);
    return false;
  }
}
