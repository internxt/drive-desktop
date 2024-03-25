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
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';
import Logger from 'electron-log';
import { ParentFolderFinder } from '../../folders/application/ParentFolderFinder';
import { ContentsId } from '../../contents/domain/ContentsId';
import { basename } from 'path';
export class FileCreator {
  constructor(
    private readonly remote: RemoteFileSystem,
    private readonly repository: FileRepository,
    private readonly parentFolderFinder: ParentFolderFinder,
    private readonly fileDeleter: FileDeleter,
    private readonly eventBus: EventBus,
    private readonly notifier: SyncFileMessenger
  ) {}

  async run(path: string, contentsId: string, size: number): Promise<File> {
    try {
      const existingFiles = this.repository.matchingPartial({
        path: PlatformPathConverter.winToPosix(path),
        status: FileStatuses.EXISTS,
      });

      if (existingFiles) {
        await Promise.all(
          existingFiles.map((existingFile) =>
            this.fileDeleter.run(existingFile.contentsId)
          )
        );
      }

      const fileSize = new FileSize(size);
      const filePath = new FilePath(path);

      const folder = await this.parentFolderFinder.run(filePath);

      const offline = OfflineFile.create(
        new ContentsId(contentsId),
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
      const message = error instanceof Error ? error.message : 'unknown error';

      Logger.error('[File Creator]', message);

      const cause =
        error instanceof DriveDesktopError ? error.syncErrorCause : 'UNKNOWN';

      await this.notifier.issues({
        error: 'UPLOAD_ERROR',
        cause,
        name: basename(path),
      });

      throw error;
    }
  }
}
