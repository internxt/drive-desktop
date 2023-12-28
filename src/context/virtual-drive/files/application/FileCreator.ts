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

export class FileCreator {
  constructor(
    private readonly remote: RemoteFileSystem,
    private readonly repository: FileRepository,
    private readonly folderFinder: FolderFinder,
    private readonly fileDeleter: FileDeleter,
    private readonly eventBus: EventBus
  ) {}

  async run(path: string, contentsId: string, size: number): Promise<File> {
    try {
      const filePath = new FilePath(path);

      const existingFile = this.repository.searchByPartial({
        path: PlatformPathConverter.winToPosix(filePath.value),
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
      // this.ipc.send('FILE_CREATED', {
      //   name: file.name,
      //   extension: file.type,
      //   nameWithExtension: file.nameWithExtension,
      // });

      return file;
    } catch (error: unknown) {
      const _message = error instanceof Error ? error.message : 'unknown error';

      // this.ipc.send('FILE_UPLOAD_ERROR', {
      //   name: filePath.name(),
      //   extension: filePath.extension(),
      //   nameWithExtension: filePath.nameWithExtension(),
      //   error: message,
      // });
      throw error;
    }
  }
}
