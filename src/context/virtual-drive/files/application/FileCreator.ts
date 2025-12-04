import { HttpRemoteFileSystem } from '../infrastructure/HttpRemoteFileSystem';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { FolderNotFoundError } from '../../folders/domain/errors/FolderNotFoundError';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { AbsolutePath, pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';

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

    const fileDto = await HttpRemoteFileSystem.persist(ctx, {
      contentsId: contents.id,
      folderUuid: parentInfo.uuid,
      path,
      size: contents.size,
    });

    const { error } = await ipcRendererSqlite.invoke('fileCreateOrUpdate', {
      file: {
        ...fileDto,
        size: Number(fileDto.size),
        isDangledStatus: false,
        userUuid: ctx.userUuid,
        workspaceId: ctx.workspaceId,
      },
      bucket: ctx.bucket,
      path,
    });

    if (error) throw error;

    return fileDto;
  }
}
