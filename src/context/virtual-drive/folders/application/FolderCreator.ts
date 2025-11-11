import { posix } from 'node:path';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { pathUtils, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';

type TProps = {
  ctx: ProcessSyncContext;
  path: RelativePath;
};

export class FolderCreator {
  static async run({ ctx, path }: TProps) {
    const posixDir = pathUtils.dirname(path);
    const { data: parentInfo } = NodeWin.getFolderInfo({ ctx, path: posixDir });

    if (!parentInfo) {
      throw new FolderNotFoundError(posixDir);
    }

    const { data: folder, error } = await ipcRendererDriveServerWip.invoke('createFolder', {
      userUuid: ctx.userUuid,
      workspaceId: ctx.workspaceId,
      parentUuid: parentInfo.uuid,
      plainName: posix.basename(path),
      path,
    });

    if (error) throw error;

    ctx.virtualDrive.convertToPlaceholder({ itemPath: path, id: `FOLDER:${folder.uuid}` });
  }
}
