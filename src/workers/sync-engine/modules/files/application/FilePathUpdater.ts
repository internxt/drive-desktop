import { ActionNotPermittedError } from '../domain/errors/ActionNotPermittedError';
import { FileAlreadyExistsError } from '../domain/errors/FileAlreadyExistsError';
import { FilePath } from '../domain/FilePath';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { FolderFinder } from '../../folders/application/FolderFinder';
import { FileFinderByContentsId } from './FileFinderByContentsId';
import { SyncEngineIpc } from '../../../ipcRendererSyncEngine';

export class FilePathUpdater {
  constructor(
    private readonly repository: FileRepository,
    private readonly fileFinderByContentsId: FileFinderByContentsId,
    private readonly folderFinder: FolderFinder,
    private readonly ipc: SyncEngineIpc
  ) {}

  private async rename(file: File, path: FilePath) {
    file.rename(path);

    await this.repository.updateName(file);

    // await this.eventBus.publish(file.pullDomainEvents());
  }

  async run(contentsId: string, posixRelativePath: string) {
    const destination = new FilePath(posixRelativePath);
    const file = this.fileFinderByContentsId.run(contentsId);

    if (file.dirname !== destination.dirname()) {
      if (file.nameWithExtension !== destination.nameWithExtension()) {
        throw new ActionNotPermittedError('rename and change folder');
      }

      const destinationFolder = this.folderFinder.run(destination.dirname());

      file.moveTo(destinationFolder);

      await this.repository.updateParentDir(file);
      return;
    }

    const destinationFile = this.repository.search(destination);

    if (destinationFile) {
      this.ipc.send('FILE_RENAME_ERROR', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        error: 'Renaming error: file already exists',
      });
      throw new FileAlreadyExistsError(destination.name());
    }

    if (destination.extensionMatch(file.type)) {
      this.ipc.send('FILE_RENAMING', {
        oldName: file.name,
        nameWithExtension: destination.nameWithExtension(),
      });
      await this.rename(file, destination);
      this.ipc.send('FILE_RENAMED', {
        oldName: file.name,
        nameWithExtension: destination.nameWithExtension(),
      });
      return;
    }

    throw new Error('Cannot reupload files atm');
  }
}
