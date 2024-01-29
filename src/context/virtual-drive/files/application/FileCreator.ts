import { FolderFinder } from '../../folders/application/FolderFinder';
import { FilePath } from '../domain/FilePath';
import { File } from '../domain/File';
import { FileSize } from '../domain/FileSize';
import { EventBus } from '../../shared/domain/EventBus';
import { FileDeleter } from './FileDeleter';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { FileRepository } from '../domain/FileRepository';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { OfflineFile } from '../domain/OfflineFile';
import { SyncFileMessenger } from '../domain/SyncFileMessenger';
import { FileStatuses } from '../domain/FileStatus';

export class FileCreator {
  constructor(
    private readonly remote: RemoteFileSystem,
    private readonly repository: FileRepository,
    private readonly folderFinder: FolderFinder,
    private readonly fileDeleter: FileDeleter,
    private readonly eventBus: EventBus,
    private readonly notifier: SyncFileMessenger
  ) {}

  async run(
    filePath: FilePath,
    contentsId: string,
    size: number
  ): Promise<File> {
    try {
      const existingFile = this.repository.searchByPartial({
        path: PlatformPathConverter.winToPosix(filePath.value),
        status: FileStatuses.EXISTS,
      });

      if (existingFile) {
        await this.fileDeleter.run(existingFile.contentsId);
      }

      const fileSize = new FileSize(size);

      const folder = this.folderFinder.findFromFilePath(filePath);

      const offline = OfflineFile.create(
        contentsId,
        folder,
        fileSize,
        filePath
      );

      const persistedAttributes = await this.remote.persist(offline);
      const file = File.create(persistedAttributes);

      await this.repository.add(file);

      await this.eventBus.publish(offline.pullDomainEvents());
      await this.notifier.created(file.name, file.type);

      return file;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : '[File Creator] unknown error';

      await this.notifier.errorWhileCreating(
        filePath.name(),
        filePath.extension(),
        message
      );

      throw error;
    }
  }
}
