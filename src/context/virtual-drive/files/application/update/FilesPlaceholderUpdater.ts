import fs from 'fs/promises';
import { RelativePathToAbsoluteConverter } from '../../../shared/application/RelativePathToAbsoluteConverter';
import { File } from '../../domain/File';
import { FileStatuses } from '../../domain/FileStatus';
import { NodeWinLocalFileSystem } from '../../infrastructure/NodeWinLocalFileSystem';
import { InMemoryFileRepository } from '../../infrastructure/InMemoryFileRepository';
import { validateWindowsName } from '@/context/virtual-drive/items/validate-windows-name';

export class FilesPlaceholderUpdater {
  constructor(
    private readonly repository: InMemoryFileRepository,
    private readonly localFileSystem: NodeWinLocalFileSystem,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter,
  ) {}

  private hasToBeUpdatedIdentity(local: File, remote: File): boolean {
    const localExists = local.status.is(FileStatuses.EXISTS);

    const systemFileidentity = this.localFileSystem.getFileIdentity(local.path);
    const remoteIdentity = remote.placeholderId;

    const isDifferentIdentity = systemFileidentity !== remoteIdentity;

    return localExists && isDifferentIdentity && systemFileidentity !== '';
  }
  private async hasToBeCreated(remote: File): Promise<boolean> {
    const win32AbsolutePath = this.relativePathToAbsoluteConverter.run(remote.path);
    const existsFile = await this.fileExists(win32AbsolutePath);
    return !existsFile;
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
    const { isValid } = validateWindowsName({
      path: remote.path,
      name: remote.name,
    });

    if (!isValid) return;

    const local = this.repository.searchByPartial({
      contentsId: remote.contentsId,
    });

    if (!local) {
      this.repository.add(remote);
      this.localFileSystem.createPlaceHolder(remote);
      return;
    }

    /*
     * v2.5.2 Jonathan Daniel
     * Validate if the placeholder needs to be updated since we previously used the dynamic contentsId
     * and now we use the static uuid for file identification.
     * DELETE AFTER ONE YEAR.
     */
    if (this.hasToBeUpdatedIdentity(local, remote)) {
      this.localFileSystem.updateFileIdentity(local.path, local.placeholderId);
      this.localFileSystem.updateSyncStatus(local);
    }

    if (local.path !== remote.path) {
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
