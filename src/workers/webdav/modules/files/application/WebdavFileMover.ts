import { WebdavFolderFinder } from '../../folders/application/WebdavFolderFinder';
import { Folder } from '../../folders/domain/Folder';
import { WebdavServerEventBus } from '../../shared/domain/WebdavServerEventBus';
import { FileAlreadyExistsError } from '../domain/errors/FileAlreadyExistsError';
import { UnknownFileActionError } from '../domain/errors/UnknownFileActionError';
import { FilePath } from '../domain/FilePath';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { FilePathUpdater } from './FilePathUpdater';
import { VirtualDriveIpc } from '../../../ipc';

export class WebdavFileMover {
  constructor(
    private readonly repository: FileRepository,
    private readonly folderFinder: WebdavFolderFinder,
    private readonly fileRenamer: FilePathUpdater,
    private readonly eventBus: WebdavServerEventBus,
    private readonly ipc: VirtualDriveIpc
  ) {}

  private async move(file: File, folder: Folder) {
    file.moveTo(folder);

    await this.repository.updateParentDir(file);

    await this.eventBus.publish(file.pullDomainEvents());

    this.ipc.send('WEBDAV_FILE_MOVED', {
      nameWithExtension: file.nameWithExtension,
      folderName: file.dirname,
    });
  }

  private async overwite(file: File, destinationFile: File, folder: Folder) {
    file.moveTo(folder);
    destinationFile.trash();

    await this.repository.delete(destinationFile);
    await this.repository.updateParentDir(file);

    await this.eventBus.publish(file.pullDomainEvents());
    await this.eventBus.publish(destinationFile.pullDomainEvents());

    this.ipc.send('WEBDAV_FILE_OVERWRITED', {
      nameWithExtension: file.nameWithExtension,
    });
  }

  private noMoreActionsLeft(action: never) {
    if (action) throw new UnknownFileActionError('WebdavFileMover');
  }

  async run(file: File, to: string, overwrite: boolean): Promise<boolean> {
    const desiredPath = new FilePath(to);
    const destinationFile = this.repository.search(desiredPath);

    const hasToBeOverwritten =
      destinationFile !== undefined && destinationFile !== null;

    if (hasToBeOverwritten && !overwrite) {
      throw new FileAlreadyExistsError(to);
    }

    const destinationFolder = this.folderFinder.run(desiredPath.dirname());

    if (file.hasParent(destinationFolder.id)) {
      await this.fileRenamer.run(file, new FilePath(to));
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
