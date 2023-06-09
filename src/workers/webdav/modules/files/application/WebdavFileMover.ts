import { WebdavFolder } from '../../folders/domain/WebdavFolder';
import { WebdavFolderFinder } from '../../folders/application/WebdavFolderFinder';
import { FilePath } from '../domain/FilePath';
import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';
import { FileAlreadyExistsError } from '../domain/errors/FileAlreadyExistsError';
import { UnknownFileActionError } from '../domain/errors/UnknownFileActionError';
import { ActionNotPermitedError } from '../domain/errors/ActionNotPermitedError';
import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';

export class WebdavFileMover {
  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly folderFinder: WebdavFolderFinder,
    private readonly eventBus: WebdavServerEventBus
  ) {}

  private async rename(file: WebdavFile, path: FilePath) {
    file.rename(path);

    await this.repository.updateName(file);

    await this.eventBus.publish(file.pullDomainEvents());
  }

  private async move(file: WebdavFile, folder: WebdavFolder) {
    file.moveTo(folder);

    await this.repository.updateParentDir(file);

    await this.eventBus.publish(file.pullDomainEvents());
  }

  private async overwite(
    file: WebdavFile,
    destinationFile: WebdavFile,
    folder: WebdavFolder
  ) {
    file.moveTo(folder);
    destinationFile.trash();

    await this.repository.delete(destinationFile);
    await this.repository.updateParentDir(file);

    await this.eventBus.publish(file.pullDomainEvents());
    await this.eventBus.publish(destinationFile.pullDomainEvents());
  }

  private noMoreActionsLeft(action: never) {
    if (action) throw new UnknownFileActionError('WebdavFileMover');
  }

  async run(
    file: WebdavFile,
    to: string,
    overwrite: boolean
  ): Promise<boolean> {
    const desiredPath = new FilePath(to);
    const destinationFile = this.repository.search(desiredPath);

    const hasToBeOverwritten =
      destinationFile !== undefined && destinationFile !== null;

    if (hasToBeOverwritten && !overwrite) {
      throw new FileAlreadyExistsError(to);
    }

    const destinationFolder = this.folderFinder.run(desiredPath.dirname());

    if (file.hasParent(destinationFolder.id)) {
      if (hasToBeOverwritten) {
        throw new ActionNotPermitedError('overwrite');
      }

      await this.rename(file, desiredPath);
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
