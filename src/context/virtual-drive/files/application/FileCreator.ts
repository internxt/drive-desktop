import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { FolderNotFoundError } from '../../folders/domain/errors/FolderNotFoundError';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { AbsolutePath, pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';
import { ContentsUploader } from '../../contents/application/ContentsUploader';

type Props = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  size: number;
};

export class FileCreator {
  static async run({ ctx, path, size }: Props) {
    const contentsId = await ContentsUploader.run({ ctx, path, size });

    ctx.logger.debug({ msg: 'File uploaded', path, contentsId, size });

    const parentPath = pathUtils.dirname(path);
    const { data: parentInfo } = await NodeWin.getFolderInfo({ ctx, path: parentPath });

    if (!parentInfo) {
      throw new FolderNotFoundError(parentPath);
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

    if (error) throw error;

    return data;
  }
}
