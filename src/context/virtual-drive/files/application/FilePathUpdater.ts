import Logger from 'electron-log';
import { ParentFolderFinder } from '../../folders/application/ParentFolderFinder';
import { EventBus } from '../../shared/domain/EventBus';
import { File } from '../domain/File';
import { FilePath } from '../domain/FilePath';
import { FileRepository } from '../domain/FileRepository';
import { FileStatuses } from '../domain/FileStatus';
import { ActionNotPermittedError } from '../domain/errors/ActionNotPermittedError';
import { FileAlreadyExistsError } from '../domain/errors/FileAlreadyExistsError';
import { FileNotFoundError } from '../domain/errors/FileNotFoundError';
import { FileRenameFailedDomainEvent } from '../domain/events/FileRenameFailedDomainEvent';
import { FileRenameStartedDomainEvent } from '../domain/events/FileRenameStartedDomainEvent';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { SingleFileMatchingSearcher } from './SingleFileMatchingSearcher';

export class FilePathUpdater {
  constructor(
    private readonly remote: RemoteFileSystem,
    private readonly local: LocalFileSystem,
    private readonly repository: FileRepository,
    private readonly singleFileMatching: SingleFileMatchingSearcher,
    private readonly parentFolderFinder: ParentFolderFinder,
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
    Logger.debug('trackerId', trackerId);

    const destinationFolder = await this.parentFolderFinder.run(destination);
    Logger.debug('destinationFolder', destinationFolder);
    file.moveTo(destinationFolder, trackerId);

    Logger.debug('REMOTE CHANGES');
    await this.remote.move(file);
    await this.repository.update(file);

    const events = file.pullDomainEvents();
    this.eventBus.publish(events);
    Logger.debug('DONE');
  }

  async run(contentsId: string, posixRelativePath: string) {
    const destination = new FilePath(posixRelativePath);
    const file = await this.singleFileMatching.run({
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

      Logger.debug('MOVE');

      await this.move(file, destination);
      return;
    }

    const destinationFile = this.repository.matchingPartial({
      path: destination.value,
      status: FileStatuses.EXISTS,
    });

    if (destinationFile.length > 0) {
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
