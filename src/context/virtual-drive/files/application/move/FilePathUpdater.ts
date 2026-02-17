import { Service } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { ParentFolderFinder } from '../../../folders/application/ParentFolderFinder';
import { EventBus } from '../../../shared/domain/EventBus';
import { File } from '../../domain/File';
import { FilePath } from '../../domain/FilePath';
import { FileRepository } from '../../domain/FileRepository';
import { FileStatuses } from '../../domain/FileStatus';
import { ActionNotPermittedError } from '../../domain/errors/ActionNotPermittedError';
import { FileAlreadyExistsError } from '../../domain/errors/FileAlreadyExistsError';
import { FileNotFoundError } from '../../domain/errors/FileNotFoundError';
import { FileRenameFailedDomainEvent } from '../../domain/events/FileRenameFailedDomainEvent';
import { FileRenameStartedDomainEvent } from '../../domain/events/FileRenameStartedDomainEvent';
import { SingleFileMatchingSearcher } from '../search/SingleFileMatchingSearcher';
import { moveFile } from '../../../../../infra/drive-server/services/files/services/move-file';
import { renameFile } from '../../../../../infra/drive-server/services/files/services/rename-file';

@Service()
export class FilePathUpdater {
  constructor(
    private readonly repository: FileRepository,
    private readonly singleFileMatching: SingleFileMatchingSearcher,
    private readonly parentFolderFinder: ParentFolderFinder,
    private readonly eventBus: EventBus,
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

    await renameFile({
      fileUuid: file.uuid,
      plainName: file.name,
      type: file.type,
    });
    await this.repository.update(file);

    const events = file.pullDomainEvents();
    this.eventBus.publish(events);
  }

  private async move(file: File, destination: FilePath) {
    const destinationFolder = await this.parentFolderFinder.run(destination);
    logger.debug({ msg: 'destinationFolder', destinationFolder });
    file.moveTo(destinationFolder);

    logger.debug({ msg: 'REMOTE CHANGES' });
    await moveFile({
      uuid: file.uuid,
      destinationFolder: destinationFolder.uuid,
    });
    await this.repository.update(file);

    const events = file.pullDomainEvents();
    this.eventBus.publish(events);
    logger.debug({ msg: 'DONE' });
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

    logger.debug({ msg: 'FILE RENAMER FILE FOUNDED' });

    if (file.dirname !== destination.dirname()) {
      if (file.nameWithExtension !== destination.nameWithExtension()) {
        throw new ActionNotPermittedError('rename and change folder');
      }

      logger.debug({ msg: 'MOVE' });

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
