import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { isMoveFileEvent } from './is-move-event';
import { deleteFileByUuid } from '@/infra/drive-server-wip/out/ipc-main';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  uuid: FileUuid;
};

export async function unlinkFile({ ctx, path, uuid }: TProps) {
  const isMove = await isMoveFileEvent({ uuid });

  if (isMove) {
    ctx.logger.debug({ msg: 'Is move file event', path });
    return;
  }

  ctx.logger.debug({ msg: 'File unlinked', path });

  await deleteFileByUuid({ ctx, uuid, path });
}
