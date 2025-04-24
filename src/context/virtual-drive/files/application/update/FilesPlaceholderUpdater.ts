import fs from 'fs/promises';
import { LocalFileIdProvider } from '../../../shared/application/LocalFileIdProvider';
import { RelativePathToAbsoluteConverter } from '../../../shared/application/RelativePathToAbsoluteConverter';
import { File } from '../../domain/File';
import { FileStatuses } from '../../domain/FileStatus';
import { FileMovedDomainEvent } from '../../domain/events/FileMovedDomainEvent';
import { NodeWinLocalFileSystem } from '../../infrastructure/NodeWinLocalFileSystem';
import { InMemoryFileRepository } from '../../infrastructure/InMemoryFileRepository';
import { InMemoryEventRepository } from '@/context/virtual-drive/shared/infrastructure/InMemoryEventHistory';
import { logger } from '@/apps/shared/logger/logger';

export class FilesPlaceholderUpdater {
  constructor(
    private readonly repository: InMemoryFileRepository,
    private readonly localFileSystem: NodeWinLocalFileSystem,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter,
    private readonly localFileIdProvider: LocalFileIdProvider,
    private readonly eventHistory: InMemoryEventRepository,
  ) {}

  private hasToBeDeleted(local: File, remote: File): boolean {
    const localExists = local.status.is(FileStatuses.EXISTS);
    const remoteIsTrashed = remote.status.is(FileStatuses.TRASHED);
    const remoteIsDeleted = remote.status.is(FileStatuses.DELETED);
    return localExists && (remoteIsTrashed || remoteIsDeleted);
  }

  private async hasToBeUpdatedIdentity(local: File, remote: File): Promise<boolean> {
    const localExists = local.status.is(FileStatuses.EXISTS);
    const remoteExists = remote.status.is(FileStatuses.EXISTS);

    const systemFileidentity = await this.localFileSystem.getFileIdentity(local.path);
    const remoteIdentity = remote.placeholderId;

    const isDifferentIdentity = systemFileidentity !== remoteIdentity;

    logger.debug({
      msg: '[FilesPlaceholderUpdater] Updating file identity',
      systemFileidentity,
      remoteIdentity,
    });

    return localExists && remoteExists && isDifferentIdentity && systemFileidentity !== '';
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

  async update(remote: File): Promise<void> {
    const local = this.repository.searchByPartial({
      contentsId: remote.contentsId,
    });

    if (!local) {
      if (remote.status.is(FileStatuses.EXISTS)) {
        this.repository.add(remote);
        this.localFileSystem.createPlaceHolder(remote);
      }
      return;
    }

    // v2.5.2 Jonathan Daniel
    // Validate if the placeholder needs to be updated since we previously used the dynamic contentsId
    // and now we use the static uuid for file identification.
    if (await this.hasToBeUpdatedIdentity(local, remote)) {
      this.localFileSystem.updateFileIdentity(local.path, local.placeholderId);
      this.localFileSystem.updateSyncStatus(local);
    }

    if (local.path !== remote.path) {
      if (remote.folderId !== local.folderId) {
        const trackerId = await this.localFileIdProvider.run(local.path);
        const event = new FileMovedDomainEvent({
          aggregateId: remote.contentsId,
          trackerId,
        });
        await this.eventHistory.store(event);
      }

      this.repository.update(remote);

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
      await fs.rm(win32AbsolutePath);
    }

    if (await this.hasToBeCreated(remote)) {
      this.localFileSystem.createPlaceHolder(remote);
      this.repository.update(remote);
    }
  }

  async run(remotes: Array<File>): Promise<void> {
    const updatePromises = remotes.map((remote) => this.update(remote));

    await Promise.all(updatePromises);
  }
}
