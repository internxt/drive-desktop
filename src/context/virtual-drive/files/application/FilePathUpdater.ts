import { ActionNotPermittedError } from '../domain/errors/ActionNotPermittedError';
import { FileAlreadyExistsError } from '../domain/errors/FileAlreadyExistsError';
import { FilePath } from '../domain/FilePath';
import { File } from '../domain/File';
import { FolderFinder } from '../../folders/application/FolderFinder';
import { EventBus } from '../../shared/domain/EventBus';
import { FileRepository } from '../domain/FileRepository';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';
import { FileRenameFailedDomainEvent } from '../domain/events/FileRenameFailedDomainEvent';
import { FileRenameStartedDomainEvent } from '../domain/events/FileRenameStartedDomainEvent';
import { FileStatuses } from '../domain/FileStatus';
import { FileNotFoundError } from '../domain/errors/FileNotFoundError';
import Logger from 'electron-log';

export class FilePathUpdater {
  constructor(
    private readonly remote: RemoteFileSystem,
    private readonly local: LocalFileSystem,
    private readonly repository: FileRepository,
    private readonly folderFinder: FolderFinder,
    private readonly eventBus: EventBus
  ) {}

  private async rename(file: File, path: FilePath) {
    this.eventBus.publish([
      new FileRenameStartedDomainEvent({
        aggregateId: file.contentsId,
        oldName: file.name,
        nameWithExtension: path.nameWithExtension(),
      }),
    ]);

    file.rename(path);

    await this.remote.rename(file);
    await this.repository.update(file);

    const events = file.pullDomainEvents();
    this.eventBus.publish(events);
  }

  private async move(file: File, destination: FilePath) {
    const trackerId = await this.local.getLocalFileId(file);

    const destinationFolder = this.folderFinder.run(destination.dirname());

    file.moveTo(destinationFolder, trackerId);

    await this.remote.move(file);
    await this.repository.update(file);

    const events = file.pullDomainEvents();
    this.eventBus.publish(events);
  }

  async run(contentsId: string, posixRelativePath: string) {
    const destination = new FilePath(posixRelativePath);
    const file = this.repository.searchByPartial({
      contentsId,
      status: FileStatuses.EXISTS,
    });

    if (!file) {
      throw new FileNotFoundError(contentsId);
    }

    Logger.debug('FILE RENAMER FILE FOUNDED');

    if (file.dirname !== destination.dirname()) {
      if (file.nameWithExtension !== destination.nameWithExtension()) {
        throw new ActionNotPermittedError('rename and change folder');
      }

      await this.move(file, destination);
      return;
    }

    const destinationFile = this.repository.searchByPartial({
      path: destination.value,
      status: FileStatuses.EXISTS,
    });

    if (destinationFile) {
      this.eventBus.publish([
        new FileRenameFailedDomainEvent({
          aggregateId: file.contentsId,
          name: file.name,
          extension: file.type,
          nameWithExtension: file.nameWithExtension,
          error: 'Renaming error: file already exists',
        }),
      ]);
      throw new FileAlreadyExistsError(destination.name());
    }

    if (destination.extensionMatch(file.type)) {
      await this.rename(file, destination);
      return;
    }

    throw new Error('Cannot reupload files atm');
  }
}
