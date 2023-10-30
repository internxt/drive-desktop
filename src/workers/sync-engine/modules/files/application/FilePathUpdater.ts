import { FileAlreadyExistsError } from '../domain/errors/FileAlreadyExistsError';
import { FilePath } from '../domain/FilePath';
import { FileRepository } from '../domain/FileRepository';
import { FileFinderByContentsId } from './FileFinderByContentsId';
import { SyncEngineIpc } from '../../../ipcRendererSyncEngine';
import { FileRenamer } from './FileRenamer';
import { FileMover } from './FileMover';

export class FilePathUpdater {
  constructor(
    private readonly repository: FileRepository,
    private readonly fileFinderByContentsId: FileFinderByContentsId,
    private readonly renamer: FileRenamer,
    private readonly mover: FileMover,
    private readonly ipc: SyncEngineIpc
  ) {}

  private async checkPathIsAvailable(desiredPath: FilePath) {
    const file = await this.repository.searchByPartial({
      path: desiredPath.value,
    });

    if (!file) {
      return;
    }

    this.ipc.send('FILE_RENAME_ERROR', {
      name: file.name,
      extension: file.type,
      nameWithExtension: file.nameWithExtension,
      error: 'Renaming error: file already exists',
    });
    throw new FileAlreadyExistsError(desiredPath.name());
  }

  async run(contentsId: string, posixRelativePath: string) {
    const file = await this.fileFinderByContentsId.run(contentsId);
    const desiredPath = new FilePath(posixRelativePath);

    await this.checkPathIsAvailable(desiredPath);

    if (file.type !== desiredPath.extension()) {
      throw new Error('Cannot change the files extensions');
    }

    if (file.dirname !== desiredPath.dirname()) {
      // update is a move
      this.mover.run(file, desiredPath);
    }

    if (file.name !== desiredPath.name()) {
      // update is a file rename
      this.ipc.send('FILE_RENAMING', {
        oldName: file.name,
        nameWithExtension: desiredPath.nameWithExtension(),
      });
      await this.renamer.run(file, desiredPath);
      this.ipc.send('FILE_RENAMED', {
        oldName: file.name,
        nameWithExtension: desiredPath.nameWithExtension(),
      });
    }
  }
}
