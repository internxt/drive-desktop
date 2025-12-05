import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { FolderNotFoundError } from '../../folders/domain/errors/FolderNotFoundError';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { AbsolutePath, pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';

type Props = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  contentsId: ContentsId;
  size: number;
};

export class FileCreator {
  static async run({ ctx, path, contentsId, size }: Props) {
    const parentPath = pathUtils.dirname(path);
    const { data: parentInfo, error: error1 } = await NodeWin.getFolderInfo({ ctx, path: parentPath });

    if (error1) {
      if (error1?.code === 'NOT_A_PLACEHOLDER') throw new FolderNotFoundError(parentPath);
      else throw error1;
    }

    const { data, error } = await ipcRendererDriveServerWip.invoke('persistFile', {
      ctx: {
        bucket: ctx.bucket,
        userUuid: ctx.userUuid,
        workspaceId: ctx.workspaceId,
        workspaceToken: ctx.workspaceToken,
      },
      path,
      parentUuid: parentInfo.uuid,
      contentsId,
      size,
    });

    if (error2) throw error2;

    return data;
  }
}
