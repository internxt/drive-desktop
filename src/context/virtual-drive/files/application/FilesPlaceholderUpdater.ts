import fs from 'fs/promises';
import { LocalFileIdProvider } from '../../shared/application/LocalFileIdProvider';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import { EventRepository } from '../../shared/domain/EventRepository';
import { File } from '../domain/File';
import { FileStatuses } from '../domain/FileStatus';
import { FileMovedDomainEvent } from '../domain/events/FileMovedDomainEvent';
import { FileRenamedDomainEvent } from '../domain/events/FileRenamedDomainEvent';
import { NodeWinLocalFileSystem } from '../infrastructure/NodeWinLocalFileSystem';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';

export class FilesPlaceholderUpdater {
  constructor(
    private readonly repository: InMemoryFileRepository,
    private readonly localFileSystem: NodeWinLocalFileSystem,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter,
    private readonly localFileIdProvider: LocalFileIdProvider,
    private readonly eventHistory: EventRepository,
  ) {}

  private hasToBeDeleted(local: File, remote: File): boolean {
    const localExists = local.status.is(FileStatuses.EXISTS);
    const remoteIsTrashed = remote.status.is(FileStatuses.TRASHED);
    const remoteIsDeleted = remote.status.is(FileStatuses.DELETED);
    return localExists && (remoteIsTrashed || remoteIsDeleted);
  }

  private async hasToBeCreated(remote: File): Promise<boolean> {
    const remoteExists = remote.status.is(FileStatuses.EXISTS);
    const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(remote.path);
    const existsFile = await this.fileExists(win32AbsolutePath);
    return remoteExists && !existsFile;
  }

  private async fileExists(win32AbsolutePath: string): Promise<boolean> {
    try {
      await fs.stat(win32AbsolutePath);
      return true;
    } catch {
      return false;
    }
  }

  private async update(remote: File): Promise<void> {
    const local = this.repository.searchByPartial({
      contentsId: remote.contentsId,
    });

    if (!local) {
      if (remote.status.is(FileStatuses.EXISTS)) {
        await this.repository.add(remote);
        await this.localFileSystem.createPlaceHolder(remote);
      }
      return;
    }

    if (local.path !== remote.path) {
      const trackerId = await this.localFileIdProvider.run(local.path);
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

      await this.repository.update(remote);

      try {
        await fs.stat(remote.path);
        // Do nothing
      } catch {
        const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(local.path);
        const newWin32AbsolutePath = this.relativePathToAbsoluteConverter.run(remote.path);
        await fs.rename(win32AbsolutePath, newWin32AbsolutePath);
      }
    }

    if (this.hasToBeDeleted(local, remote)) {
      const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(local.path);
      await fs.unlink(win32AbsolutePath);
    }

    if (await this.hasToBeCreated(remote)) {
      await this.localFileSystem.createPlaceHolder(remote);
      await this.repository.update(remote);
    }
  }

  async run(remotes: Array<File>): Promise<void> {
    const updatePromises = remotes.map((remote) => this.update(remote));

    await Promise.all(updatePromises);
  }
}
