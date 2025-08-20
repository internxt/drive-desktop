import { FilePath } from '../domain/FilePath';
import { RemoteFileContents } from '../../contents/domain/RemoteFileContents';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { HttpRemoteFileSystem } from '../infrastructure/HttpRemoteFileSystem';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { logger } from '@/apps/shared/logger/logger';
import { FolderNotFoundError } from '../../folders/domain/errors/FolderNotFoundError';
import { NodeWin } from '@/infra/node-win/node-win.module';
import VirtualDrive from '@/node-win/virtual-drive';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { persistAndIndex } from './persist-and-index';
import { ensureParentFolderExists } from './ensure-parent-folder-exists';
import { getNestedCauseMessage } from './get-nested-error-message';

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

      const fileDto = await persistAndIndex({
        remote: this.remote,
        folderUuid,
        filePath,
        contents,
        absolutePath,
      });

      return fileDto;
    } catch (error) {
      const nestedMsg = getNestedCauseMessage(error);
      if (nestedMsg === 'Folder not found') {
        const posixDir = PlatformPathConverter.getFatherPathPosix(filePath.value);
        const repaired = await ensureParentFolderExists({
          remote: this.remote,
          virtualDrive: this.virtualDrive,
          posixDir,
        });

        if (repaired) {
          const { data: folderUuid } = NodeWin.getFolderUuid({
            drive: this.virtualDrive,
            path: posixDir,
          });
          if (folderUuid) {
            const fileDto = await persistAndIndex({
              remote: this.remote,
              folderUuid,
              filePath,
              contents,
              absolutePath,
            });
            return fileDto;
          }
        }
      }

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
