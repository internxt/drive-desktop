import { FilePath } from '../domain/FilePath';
import { File } from '../domain/File';
import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { OfflineFile } from '../domain/OfflineFile';
import { HttpRemoteFileSystem } from '../infrastructure/HttpRemoteFileSystem';
import { getConfig } from '@/apps/sync-engine/config';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { logger } from '@/apps/shared/logger/logger';
import { FolderNotFoundError } from '../../folders/domain/errors/FolderNotFoundError';
import { NodeWin } from '@/infra/node-win/node-win.module';
import VirtualDrive from '@/node-win/virtual-drive';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

type Props = {
  filePath: FilePath;
  absolutePath: AbsolutePath;
  contents: RemoteFileContents;
};

export class FileCreator {
  constructor(
    private readonly remote: HttpRemoteFileSystem,
    private readonly virtualDrive: VirtualDrive,
  ) {}

  async run({ filePath, absolutePath, contents }: Props): Promise<File> {
    try {
      const posixDir = PlatformPathConverter.getFatherPathPosix(filePath.value);
      const { data: folderUuid } = NodeWin.getFolderUuid({
        drive: this.virtualDrive,
        path: posixDir,
      });

      if (!folderUuid) {
        throw new FolderNotFoundError(posixDir);
      }

      const offline = OfflineFile.from({
        contentsId: contents.id,
        folderUuid,
        path: filePath.value,
        size: contents.size,
      });

      const persistedAttributes = await this.remote.persist(offline);

      const { error } = await ipcRendererSqlite.invoke('fileCreateOrUpdate', {
        file: {
          ...persistedAttributes.dto,
          size: Number(persistedAttributes.dto.size),
          isDangledStatus: false,
          userUuid: getConfig().userUuid,
          workspaceId: getConfig().workspaceId,
        },
      });

      if (error) throw error;

      const file = File.from(persistedAttributes);

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
        key: absolutePath,
        nameWithExtension: filePath.nameWithExtension(),
      });

      throw error;
    }
  }
}
