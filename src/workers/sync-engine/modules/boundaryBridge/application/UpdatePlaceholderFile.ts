import { File } from '../../files/domain/File';
import fs from 'fs/promises';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import { FileByPartialSearcher } from '../../files/application/FileByPartialSearcher';
import { ManagedFileRepository } from '../../files/domain/ManagedFileRepository';
import { PlaceholderCreator } from '../../placeholders/domain/PlaceholderCreator';
import Logger from 'electron-log';
import { FileMovedDomainEvent } from '../../files/domain/events/FileMovedDomainEvent';
import { LocalFileIdProvider } from '../../shared/application/LocalFileIdProvider';
import { FileRenamedDomainEvent } from '../../files/domain/events/FileRenamedDomainEvent';
import { EventRepository } from '../../shared/domain/EventRepository';
import { FileStatuses } from '../../files/domain/FileStatus';

export class UpdatePlaceholderFile {
  constructor(
    private readonly fileByPartialSearcher: FileByPartialSearcher,
    private readonly managedFileRepository: ManagedFileRepository,
    private readonly virtualDrivePlaceholderCreator: PlaceholderCreator,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter,
    private readonly localFileIdProvider: LocalFileIdProvider,
    private readonly eventHistory: EventRepository
  ) {}

  private hasToBeDeleted(local: File, remote: File): boolean {
    const localExists = local.status.is(FileStatuses.EXISTS);
    const remoteIsTrashed = remote.status.is(FileStatuses.TRASHED);
    const remoteIsDeleted = remote.status.is(FileStatuses.DELETED);
    return localExists && (remoteIsTrashed || remoteIsDeleted);
  }

  async run(remote: File): Promise<void> {
    const local = this.fileByPartialSearcher.run({
      contentsId: remote.contentsId,
    });

    if (!local) {
      if (remote.status.is(FileStatuses.EXISTS)) {
        Logger.debug('Creating file placeholder: ', remote.path.value);
        await this.managedFileRepository.insert(remote);
        this.virtualDrivePlaceholderCreator.file(remote);
      }
      return;
    }

    if (local.path.value !== remote.path.value) {
      Logger.debug('Updating file placeholder: ', remote.path.value);
      const trackerId = await this.localFileIdProvider.run(local.path.value);
      if (remote.name !== local.name) {
        const event = new FileRenamedDomainEvent({
          aggregateId: remote.contentsId,
        });
        this.eventHistory.store(event);
      }
      if (remote.folderId !== local.folderId) {
        const event = new FileMovedDomainEvent({
          aggregateId: remote.contentsId,
          trackerId,
        });
        this.eventHistory.store(event);
      }

      await this.managedFileRepository.overwrite(local, remote);

      try {
        await fs.stat(remote.path.value);
        // Do nothing
      } catch {
        const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(
          local.path.value
        );
        const newWin32AbsolutePath = this.relativePathToAbsoluteConverter.run(
          remote.path.value
        );
        await fs.rename(win32AbsolutePath, newWin32AbsolutePath);
      }
    }

    if (this.hasToBeDeleted(local, remote)) {
      const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(
        local.path.value
      );
      await fs.unlink(win32AbsolutePath);
      return;
    }
  }
}
