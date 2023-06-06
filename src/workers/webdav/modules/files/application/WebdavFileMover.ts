import { WebdavFolder } from '../../folders/domain/WebdavFolder';
import { WebdavFolderFinder } from '../../folders/application/WebdavFolderFinder';
import { FilePath } from '../domain/FilePath';
import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';
import { FileAlreadyExists } from '../domain/errors/FileAlreadyExists';
import { UnknownFileAction } from '../domain/errors/UnknownFileAction';
import { ActionCannotOverwriteFile } from '../domain/errors/ActionCannotOverwriteFile';

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
    if (overwite) throw new UnknownFileAction('WebdavFileMover');
  }

  async run(
    file: WebdavFile,
    to: string,
    overwrite: boolean
  ): Promise<boolean> {
    const destination = new FilePath(to);
    const destinationFile = this.repository.search(destination.value);

    const hasToBeOverriden =
      destinationFile !== undefined && destinationFile !== null;

    if (hasToBeOverriden && !overwrite) {
      throw new FileAlreadyExists(to);
    }

    const destinationFolder = this.folderFinder.run(destination.dirname());

    if (file.hasParent(destinationFolder.id)) {
      if (hasToBeOverriden) {
        throw new ActionCannotOverwriteFile('rename');
      }

      await this.rename(file, destination);
      return false;
    }

    if (!hasToBeOverriden) {
      await this.move(file, destinationFolder);
      return false;
    }

    if (hasToBeOverriden) {
      await this.overwite(file, destinationFile, destinationFolder);
      return true;
    }

    this.noMoreActionsLeft(hasToBeOverriden);
    return false;
  }
}
