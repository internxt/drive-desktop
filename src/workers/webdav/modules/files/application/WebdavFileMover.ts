import { WebdavFolder } from '../../folders/domain/WebdavFolder';
import { WebdavFolderFinder } from '../../folders/application/WebdavFolderFinder';
import { FilePath } from '../domain/FilePath';
import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';

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
      throw new Error('File already exists');
    }

    const destinationFolder = this.folderFinder.run(destination.dirname());

    if (file.hasParent(destinationFolder.id)) {
      if (hasToBeOverriden) {
        throw new Error('Cannot rename a file to an existing file name');
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

    throw new Error('Could not complete file move');
  }
}
