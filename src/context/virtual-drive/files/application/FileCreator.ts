import { FolderFinder } from '../../folders/application/FolderFinder';
import { FilePath } from '../domain/FilePath';
import { File } from '../domain/File';
import { FileSize } from '../domain/FileSize';
import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';
import { FileDeleter } from './FileDeleter';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { OfflineFile } from '../domain/OfflineFile';
import { SyncEngineIpc } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { FileStatuses } from '../domain/FileStatus';
import Logger from 'electron-log';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { HttpRemoteFileSystem } from '../infrastructure/HttpRemoteFileSystem';
import { EventRecorder } from '../../shared/infrastructure/EventRecorder';

export class FileCreator {
  constructor(
    private readonly remote: HttpRemoteFileSystem,
    private readonly repository: InMemoryFileRepository,
    private readonly folderFinder: FolderFinder,
    private readonly fileDeleter: FileDeleter,
    private readonly eventBus: EventRecorder,
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
      const size = new FileSize(contents.size);

      const folder = this.folderFinder.findFromFilePath(filePath);

      const offline = OfflineFile.create(contents.id, folder, size, filePath);

      const persistedAttributes = await this.remote.persist(offline);

      const file = File.from(persistedAttributes);

      await this.repository.add(file);

      await this.eventBus.publish(offline.pullDomainEvents());
      this.ipc.send('FILE_CREATED', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        fileId: file.id,
        path: file.path,
      });

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
