import { WebdavIpc } from 'workers/webdav/ipc';
import { WebdavFolderFinder } from '../../folders/application/WebdavFolderFinder';
import { WebdavFolder } from '../../folders/domain/WebdavFolder';
import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';
import { ActionNotPermitedError } from '../domain/errors/ActionNotPermitedError';
import { FileAlreadyExistsError } from '../domain/errors/FileAlreadyExistsError';
import { UnknownFileActionError } from '../domain/errors/UnknownFileActionError';
import { FilePath } from '../domain/FilePath';
import { WebdavFile } from '../domain/WebdavFile';
import { WebdavFileRepository } from '../domain/WebdavFileRepository';

export class WebdavFileMover {
  constructor(
    private readonly repository: WebdavFileRepository,
    private readonly folderFinder: WebdavFolderFinder,
    private readonly eventBus: WebdavServerEventBus,
    private readonly ipc: WebdavIpc
  ) {}

  private async rename(file: WebdavFile, path: FilePath) {
    const oldName = file.nameWithExtension;

    file.rename(path);

    await this.repository.updateName(file);

    await this.eventBus.publish(file.pullDomainEvents());

    this.ipc.send('WEBDAV_FILE_RENAMED', {
      name: file.nameWithExtension,
      oldName,
    });
  }

  private async move(file: WebdavFile, folder: WebdavFolder) {
    file.moveTo(folder);

    await this.repository.updateParentDir(file);

    await this.eventBus.publish(file.pullDomainEvents());

    this.ipc.send('WEBDAV_FILE_MOVED', {
      name: file.nameWithExtension,
      folerName: file.dirname,
    });
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

    this.ipc.send('WEBDAV_FILE_OVERWRITED', {
      name: file.nameWithExtension,
    });
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
