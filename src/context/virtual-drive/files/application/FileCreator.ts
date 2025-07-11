import { FilePath } from '../domain/FilePath';
import { File } from '../domain/File';
import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { OfflineFile } from '../domain/OfflineFile';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';
import { HttpRemoteFileSystem } from '../infrastructure/HttpRemoteFileSystem';
import { getConfig } from '@/apps/sync-engine/config';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { logger } from '@/apps/shared/logger/logger';
import { FolderNotFoundError } from '../../folders/domain/errors/FolderNotFoundError';
import { NodeWin } from '@/infra/node-win/node-win.module';
import VirtualDrive from '@/node-win/virtual-drive';

export class FileCreator {
  constructor(
    private readonly remote: HttpRemoteFileSystem,
    private readonly repository: InMemoryFileRepository,
    private readonly virtualDrive: VirtualDrive,
  ) {}

  async run(filePath: FilePath, contents: RemoteFileContents): Promise<File> {
    try {
      const posixDir = PlatformPathConverter.getFatherPathPosix(filePath.value);
      const { data: folderUuid } = NodeWin.getFolderUuid({
        drive: this.virtualDrive,
        path: posixDir,
      });

      if (!folderUuid) {
        throw new FolderNotFoundError(posixDir);
      }

      /**
       * v2.5.5 Daniel Jiménez
       * TODO: we need to delete the contentsId if the file exists? Check this,
       * because technically we are adding not updating.
       * Anyway, it doesn't matter for now, there is a check that runs every 3 months do delete unused content.
       */

      // const existingFile = this.repository.searchByPartial({
      //   path: PlatformPathConverter.winToPosix(filePath.value),
      //   status: FileStatuses.EXISTS,
      // });

      // if (existingFile) {
      //   await this.fileDeleter.run(existingFile.contentsId);
      // }

      const offline = OfflineFile.from({
        contentsId: contents.id,
        folderUuid,
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
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error in file creator',
        filePath: filePath.value,
        exc: error,
      });

      ipcRendererSyncEngine.send('FILE_UPLOAD_ERROR', {
        nameWithExtension: filePath.nameWithExtension(),
      });

      throw error;
    }
  }
}
