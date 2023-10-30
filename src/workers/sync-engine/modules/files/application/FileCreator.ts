import { FolderFinder } from '../../folders/application/FolderFinder';
import { FilePath } from '../domain/FilePath';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { FileSize } from '../domain/FileSize';
import { EventBus } from '../../shared/domain/EventBus';
import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';
import { FileDeleter } from './FileDeleter';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { SyncEngineIpc } from '../../../ipcRendererSyncEngine';
import { OfflineFile } from '../domain/OfflineFile';
import { FileInternxtFileSystem } from '../domain/FileInternxtFileSystem';

export class FileCreator {
  constructor(
    private readonly repository: FileRepository,
    private readonly fileSystem: FileInternxtFileSystem,
    private readonly folderFinder: FolderFinder,
    private readonly fileDeleter: FileDeleter,
    private readonly eventBus: EventBus,
    private readonly ipc: SyncEngineIpc
  ) {}

  async run(filePath: FilePath, contents: RemoteFileContents): Promise<File> {
    try {
      const existingFile = await this.repository.searchByPartial({
        path: PlatformPathConverter.winToPosix(filePath.value),
      });

      if (existingFile) {
        await this.fileDeleter.run(existingFile.contentsId);
      }

      const size = new FileSize(contents.size);

      const folder = await this.folderFinder.run(filePath.dirname());

      const offlineFile = OfflineFile.create(
        contents.id,
        folder,
        size,
        filePath
      );

      const attributes = await this.fileSystem.create(offlineFile);
      const file = File.create(attributes);

      await this.repository.add(file);

      await this.eventBus.publish(offlineFile.pullDomainEvents());
      this.ipc.send('FILE_CREATED', {
        name: offlineFile.name,
        extension: offlineFile.type,
        nameWithExtension: offlineFile.nameWithExtension,
      });

      return file;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'unknown error';

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
