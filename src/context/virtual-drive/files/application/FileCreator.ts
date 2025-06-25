import { FolderFinder } from '../../folders/application/FolderFinder';
import { FilePath } from '../domain/FilePath';
import { File } from '../domain/File';
import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';
import { FileDeleter } from './FileDeleter';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { OfflineFile } from '../domain/OfflineFile';
import { FileStatuses } from '../domain/FileStatus';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { HttpRemoteFileSystem } from '../infrastructure/HttpRemoteFileSystem';
import { getConfig } from '@/apps/sync-engine/config';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { logger } from '@/apps/shared/logger/logger';

export class FileCreator {
  constructor(
    private readonly remote: HttpRemoteFileSystem,
    private readonly repository: InMemoryFileRepository,
    private readonly folderFinder: FolderFinder,
    private readonly fileDeleter: FileDeleter,
  ) {}

  async run(filePath: FilePath, contents: RemoteFileContents): Promise<File> {
    try {
      const existingFile = this.repository.searchByPartial({
        path: PlatformPathConverter.winToPosix(filePath.value),
        status: FileStatuses.EXISTS,
      });

      if (existingFile) {
        await this.fileDeleter.run(existingFile.contentsId);
      }

      const folder = this.folderFinder.findFromFilePath(filePath);

      const offline = OfflineFile.from({
        contentsId: contents.id,
        folderId: folder.id,
        folderUuid: folder.uuid,
        path: filePath.value,
        size: contents.size,
      });

      const persistedAttributes = await this.remote.persist(offline);

      const file = File.from(persistedAttributes);

      this.repository.add(file);

      ipcRendererSyncEngine.send('FILE_CREATED', {
        bucket: getConfig().bucket,
        name: file.name,
        extension: file.type,
        nameWithExtension: file.nameWithExtension,
        fileId: file.id,
        path: file.path,
      });

      return file;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';

      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error in file creator',
        filePath: filePath.value,
        exc: error,
      });

      ipcRendererSyncEngine.send('FILE_UPLOAD_ERROR', {
        name: filePath.name(),
        extension: filePath.extension(),
        nameWithExtension: filePath.nameWithExtension(),
        error: message,
      });

      throw error;
    }
  }
}
