import { FolderFinder } from '../../folders/application/FolderFinder';
import { FilePath } from '../domain/FilePath';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { FileSize } from '../domain/FileSize';
import { EventBus } from '../../shared/domain/WebdavServerEventBus';
import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';
import { FileDeleter } from './FileDeleter';
import { PlatformPathConverter } from '../../shared/test/helpers/PlatformPathConverter';
import { SyncEngineIpc } from '../../../ipcRendererSyncEngine';

export class FileCreator {
  constructor(
    private readonly repository: FileRepository,
    private readonly folderFinder: FolderFinder,
    private readonly fileDeleter: FileDeleter,
    private readonly eventBus: EventBus,
    private readonly ipc: SyncEngineIpc
  ) {}

  async run(filePath: FilePath, contents: RemoteFileContents): Promise<File> {
    try {
      const existingFile = this.repository.searchByPartial({
        path: PlatformPathConverter.winToPosix(filePath.value),
      });

      if (existingFile) {
        await this.fileDeleter.act(existingFile);
      }

      const size = new FileSize(contents.size);

      const folder = this.folderFinder.findFromFilePath(filePath);

      const file = File.create(contents.id, folder, size, filePath);

      await this.repository.add(file);

      await this.eventBus.publish(file.pullDomainEvents());
      this.ipc.send('FILE_CREATED', {
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
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
      return Promise.reject();
    }
  }
}
