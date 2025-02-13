import { FolderFinder } from '../../folders/application/FolderFinder';
import { FilePath } from '../domain/FilePath';
import { File } from '../domain/File';
import { FileSize } from '../domain/FileSize';
import { EventBus } from '../../shared/domain/EventBus';
import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';
import { FileDeleter } from './FileDeleter';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { OfflineFile } from '../domain/OfflineFile';
import { SyncEngineIpc } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { FileStatuses } from '../domain/FileStatus';
import { ipcRenderer } from 'electron';
import Logger from 'electron-log';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { SDKRemoteFileSystem } from '../infrastructure/SDKRemoteFileSystem';

export class FileCreator {
  constructor(
    private readonly remote: SDKRemoteFileSystem,
    private readonly repository: InMemoryFileRepository,
    private readonly folderFinder: FolderFinder,
    private readonly fileDeleter: FileDeleter,
    private readonly eventBus: EventBus,
    private readonly ipc: SyncEngineIpc,
  ) {}

  async run(filePath: FilePath, contents: RemoteFileContents, existingFileAlreadyEvaluated = false): Promise<File> {
    try {
      if (!existingFileAlreadyEvaluated) {
        const existingFile = this.repository.searchByPartial({
          path: PlatformPathConverter.winToPosix(filePath.value),
          status: FileStatuses.EXISTS,
        });

        if (existingFile) {
          await this.fileDeleter.run(existingFile.contentsId);
        }
      }
      Logger.debug('[DEBUG IN FILECREATOR STEEP 1]' + filePath.value);
      const size = new FileSize(contents.size);

      const folder = this.folderFinder.findFromFilePath(filePath);

      Logger.debug('[DEBUG IN FILECREATOR STEEP 2]' + filePath.value);

      const offline = OfflineFile.create(contents.id, folder, size, filePath);

      Logger.debug('[DEBUG IN FILECREATOR STEEP 3]' + filePath.value);

      const persistedAttributes = await this.remote.persist(offline);

      Logger.debug('[DEBUG IN FILECREATOR STEEP 4]' + filePath.value);
      const file = File.from(persistedAttributes);

      Logger.debug('[DEBUG IN FILECREATOR STEEP 5]' + filePath.value);
      await this.repository.add(file);

      Logger.debug('[DEBUG IN FILECREATOR STEEP 6]' + filePath.value);
      await this.eventBus.publish(offline.pullDomainEvents());
      this.ipc.send('FILE_CREATED', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        fileId: file.id,
        path: file.path,
      });

      ipcRenderer.send('CHECK_SYNC');

      return file;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'unknown error';

      Logger.debug('[DEBUG ERROR IN FILECREATOR]' + filePath.value, error);

      this.ipc.send('FILE_UPLOAD_ERROR', {
        name: filePath.name(),
        extension: filePath.extension(),
        nameWithExtension: filePath.nameWithExtension(),
        error: message,
      });
      throw error;
    }
  }
}
