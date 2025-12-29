import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { basename } from 'node:path';
import { getParentUuid } from './get-parent-uuid';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { unlinkFile } from './unlink-file';
import { unlinkFolder } from './unlink-folder';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
};

export async function onUnlink({ ctx, path }: TProps) {
  try {
    const parentUuid = await getParentUuid({ ctx, path });
    if (!parentUuid) return;

    const name = basename(path);

    const [{ data: file }, { data: folder }] = await Promise.all([
      SqliteModule.FileModule.getByName({ parentUuid, nameWithExtension: name }),
      SqliteModule.FolderModule.getByName({ parentUuid, plainName: name }),
    ]);

    if (file) await unlinkFile({ ctx, path, uuid: file.uuid });
    if (folder) await unlinkFolder({ ctx, path, uuid: folder.uuid });
  } catch (exc) {
    ctx.logger.error({ msg: 'Error on unlink event', path, exc });
  }
}
