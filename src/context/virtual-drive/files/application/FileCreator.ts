import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { FolderNotFoundError } from '../../folders/domain/errors/FolderNotFoundError';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { AbsolutePath, pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { ipcRendererDriveServerWip } from '@/infra/drive-server-wip/out/ipc-renderer';

type Props = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  contents: {
    id: ContentsId;
    size: number;
  };
};

export class FileCreator {
  static async run({ ctx, path, contents }: Props) {
    const parentPath = pathUtils.dirname(path);
    const { data: parentInfo } = await NodeWin.getFolderInfo({ ctx, path: parentPath });

    if (!parentInfo) {
      throw new FolderNotFoundError(parentPath);
    }

    const { data, error } = await ipcRendererDriveServerWip.invoke('persistFile', {
      ctx,
      path,
      parentUuid: parentInfo.uuid,
      contentsId: contents.id,
      size: contents.size,
    });

    if (error) throw error;

    return data;
  }
}
