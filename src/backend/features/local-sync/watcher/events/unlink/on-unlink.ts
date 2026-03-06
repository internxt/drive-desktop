import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { basename } from 'node:path';
import { getParentUuid } from './get-parent-uuid';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { deleteFileByUuid, deleteFolderByUuid } from '@/infra/drive-server-wip/out/ipc-main';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  isDirectory: boolean;
};

export async function onUnlink({ ctx, path, isDirectory }: TProps) {
  try {
    const parentUuid = await getParentUuid({ ctx, path });
    if (!parentUuid) return;

    const name = basename(path);

    if (isDirectory) {
      const { data: folder } = await SqliteModule.FolderModule.getByName({ parentUuid, plainName: name });
      if (folder) {
        ctx.logger.debug({ msg: 'Folder unlinked', path });
        await deleteFolderByUuid({ ctx, path, uuid: folder.uuid });
      }
    } else {
      const { data: file } = await SqliteModule.FileModule.getByName({ parentUuid, nameWithExtension: name });
      if (file) {
        ctx.logger.debug({ msg: 'File unlinked', path });
        await deleteFileByUuid({ ctx, path, uuid: file.uuid });
      }
    }
  } catch (error) {
    ctx.logger.error({ msg: 'Error on unlink event', path, error });
  }
}
