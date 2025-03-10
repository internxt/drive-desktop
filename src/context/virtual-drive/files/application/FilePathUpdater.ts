import { ActionNotPermittedError } from '../domain/errors/ActionNotPermittedError';
import { FileAlreadyExistsError } from '../domain/errors/FileAlreadyExistsError';
import { FilePath } from '../domain/FilePath';
import { File } from '../domain/File';
import { FolderFinder } from '../../folders/application/FolderFinder';
import { FileFinderByContentsId } from './FileFinderByContentsId';
import { EventBus } from '../../shared/domain/EventBus';
import { SyncEngineIpc } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import Logger from 'electron-log';
import { NodeWinLocalFileSystem } from '../infrastructure/NodeWinLocalFileSystem';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { HttpRemoteFileSystem } from '../infrastructure/HttpRemoteFileSystem';
import logger from '../../../../apps/shared/logger/logger';

export class FilePathUpdater {
  constructor(
    private readonly remote: HttpRemoteFileSystem,
    private readonly local: NodeWinLocalFileSystem,
    private readonly repository: InMemoryFileRepository,
    private readonly fileFinderByContentsId: FileFinderByContentsId,
    private readonly folderFinder: FolderFinder,
    private readonly ipc: SyncEngineIpc,
    private readonly eventBus: EventBus,
  ) {}

  private async rename(file: File, path: FilePath) {
    file.rename(path);

    await this.remote.rename(file);
    await this.repository.update(file);

    const events = file.pullDomainEvents();
    this.eventBus.publish(events);
  }

  private async move(file: File, destination: FilePath) {
    Logger.debug('[MOVE]', file.name, destination.value);
    const destinationFolder = this.folderFinder.run(destination.dirname());

    Logger.debug('[MOVE TO]', file.path, destinationFolder.name);
    try {
      const trackerId = await this.local.getFileIdentity(file.path);
      file.moveTo(destinationFolder, trackerId);
    } catch (exc: unknown) {
      logger.error({
        msg: 'Error in FilePathUpdater.move',
        exc,
      });
      throw exc;
    }

    Logger.debug('[REMOTE MOVE]', file.name, destinationFolder.name);
    await this.remote.move(file);
    Logger.debug('[REPOSITORY MOVE]', file.name, destinationFolder.name);
    await this.repository.update(file);

    const events = file.pullDomainEvents();
    this.eventBus.publish(events);
  }

  async run(contentsId: string, posixRelativePath: string) {
    try {
      const destination = new FilePath(posixRelativePath);
      const file = this.fileFinderByContentsId.run(contentsId);

      if (file.dirname !== destination.dirname()) {
        if (file.nameWithExtension !== destination.nameWithExtension()) {
          throw new ActionNotPermittedError('rename and change folder');
        }
        Logger.error('[RUN MOVE]', file.name, destination.value);
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

      Logger.debug('[RUN RENAME]', file.name, destination.value);
      Logger.debug('[RUN RENAME]', file.name, destination.nameWithExtension());
      Logger.debug('[RUN RENAME]', file.nameWithExtension, destination.extensionMatch(file.type));
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
    } catch (exc: unknown) {
      logger.error({
        msg: 'Error in FilePathUpdater.move',
        exc,
      });
      throw exc;
    }
  }
}
