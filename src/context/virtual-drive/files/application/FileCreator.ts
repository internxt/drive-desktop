import { FilePath } from '../domain/FilePath';
import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
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

  async run({ filePath, absolutePath, contents }: Props) {
    try {
      const posixDir = PlatformPathConverter.getFatherPathPosix(filePath.value);
      const { data: folderUuid } = NodeWin.getFolderUuid({
        drive: this.virtualDrive,
        path: posixDir,
      });

      if (!folderUuid) {
        throw new FolderNotFoundError(posixDir);
      }

      const fileDto = await this.remote.persist({
        contentsId: contents.id,
        folderUuid,
        path: filePath.value,
        size: contents.size,
      });

      const { data, error } = await ipcRendererSqlite.invoke('fileCreateOrUpdate', {
        file: {
          ...fileDto,
          size: Number(fileDto.size),
          isDangledStatus: false,
          userUuid: getConfig().userUuid,
          workspaceId: getConfig().workspaceId,
        },
        bucket: getConfig().bucket,
        absolutePath,
      });

      if (error) throw error;

      return data;
    } catch (exc) {
      ipcRendererSyncEngine.send('FILE_UPLOAD_ERROR', {
        key: absolutePath,
        nameWithExtension: filePath.nameWithExtension(),
      });

      throw logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error in file creator',
        filePath: filePath.value,
        exc,
      });
    }
  }
}
