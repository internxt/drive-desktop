import { ActionNotPermittedError } from '../domain/errors/ActionNotPermittedError';
import { FileAlreadyExistsError } from '../domain/errors/FileAlreadyExistsError';
import { FilePath } from '../domain/FilePath';
import { File } from '../domain/File';
import { FolderFinder } from '../../folders/application/FolderFinder';
import { FileFinderByContentsId } from './FileFinderByContentsId';
import { EventBus } from '../../shared/domain/EventBus';
import { FileRepository } from '../domain/FileRepository';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { LocalFileSystem } from '../domain/file-systems/LocalFileSystem';
import { SyncEngineIpc } from '../../../../apps/sync-engine/ipcRendererSyncEngine';

export class FilePathUpdater {
  constructor(
    private readonly remote: RemoteFileSystem,
    private readonly local: LocalFileSystem,
    private readonly repository: FileRepository,
    private readonly fileFinderByContentsId: FileFinderByContentsId,
    private readonly folderFinder: FolderFinder,
    private readonly ipc: SyncEngineIpc,
    private readonly eventBus: EventBus
  ) {}

  private async rename(file: File, path: FilePath) {
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
    const file = this.fileFinderByContentsId.run(contentsId);

    if (file.dirname !== destination.dirname()) {
      if (file.nameWithExtension !== destination.nameWithExtension()) {
        throw new ActionNotPermittedError('rename and change folder');
      }
      await this.move(file, destination);
      return;
    }

    const destinationFile = this.repository.searchByPartial({
      path: destination.value,
    });

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
