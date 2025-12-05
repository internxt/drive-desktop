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
    const { data: parentInfo, error: error1 } = await NodeWin.getFolderInfo({ ctx, path: parentPath });

    if (error1) {
      if (error1?.code === 'NOT_A_PLACEHOLDER') throw new FolderNotFoundError(parentPath);
      else throw error1;
    }

    const fileDto = await HttpRemoteFileSystem.persist(ctx, {
      contentsId: contents.id,
      folderUuid: parentInfo.uuid,
      path,
      size: contents.size,
    });

    const { error: error2 } = await ipcRendererSqlite.invoke('fileCreateOrUpdate', {
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

    if (error2) throw error2;

    return fileDto;
  }
}
