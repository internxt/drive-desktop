import { Service } from 'diod';
import Logger from 'electron-log';
import fs from 'fs/promises';
import { LocalFileIdProvider } from '../../shared/application/LocalFileIdProvider';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import { EventRepository } from '../../shared/domain/EventRepository';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { FileStatuses } from '../domain/FileStatus';
import { FileMovedDomainEvent } from '../domain/events/FileMovedDomainEvent';
import { FileRenamedDomainEvent } from '../domain/events/FileRenamedDomainEvent';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';

@Service()
export class FilesPlaceholderUpdater {
  constructor(
    private readonly repository: FileRepository,
    private readonly localFileSystem: LocalFileSystem,
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

  private async update(remote: File): Promise<void> {
    const local = this.repository
      .matchingPartial({ contentsId: remote.contentsId })
      .at(0);

    if (!local) {
      if (remote.status.is(FileStatuses.EXISTS)) {
        Logger.debug('Creating file placeholder: ', remote.path);
        await this.repository.add(remote);
        await this.localFileSystem.createPlaceHolder(remote);
      }
      return;
    }

    if (local.path !== remote.path) {
      Logger.debug('Updating file placeholder: ', remote.path);
      const trackerId = await this.localFileIdProvider.run(local.path);
      if (remote.name !== local.name) {
        const event = new FileRenamedDomainEvent({
          aggregateId: remote.contentsId,
          oldName: local.name,
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

      await this.repository.update(remote);

      try {
        await fs.stat(remote.path);
        // Do nothing
      } catch {
        const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(
          local.path
        );
        const newWin32AbsolutePath = this.relativePathToAbsoluteConverter.run(
          remote.path
        );
        await fs.rename(win32AbsolutePath, newWin32AbsolutePath);
      }
    }

    if (this.hasToBeDeleted(local, remote)) {
      const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(
        local.path
      );
      await fs.unlink(win32AbsolutePath);
    }
  }

  async run(remotes: Array<File>): Promise<void> {
    const updatePromises = remotes.map((remote) => this.update(remote));

    await Promise.all(updatePromises);
  }
}
