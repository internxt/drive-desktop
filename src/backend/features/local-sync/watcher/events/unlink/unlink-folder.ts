import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { isMoveEvent } from './is-move-event';
import { deleteFolderByUuid } from '@/infra/drive-server-wip/out/ipc-main';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  uuid: FolderUuid;
};

export async function unlinkFolder({ ctx, path, uuid }: TProps) {
  const isMove = await isMoveEvent({ uuid });

  if (isMove) {
    ctx.logger.debug({ msg: 'Is move folder event', path });
    return;
  }

  ctx.logger.debug({ msg: 'Folder unlinked', path });

  await deleteFolderByUuid({ ctx, path, uuid });
}
