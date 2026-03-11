import { rewind, TWO_MINUTES_IN_MILLISECONDS } from '@/apps/main/remote-sync/helpers';
import { SyncContext } from '@/apps/sync-engine/config';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

type TProps = {
  ctx: SyncContext;
  type: 'file' | 'folder';
};

export async function getCheckpoint({ ctx, type }: TProps) {
  const { data: checkpoint } = await SqliteModule.CheckpointModule.getCheckpoint({
    userUuid: ctx.userUuid,
    workspaceId: ctx.workspaceId,
    type,
  });

  if (!checkpoint) return;

  return rewind(new Date(checkpoint.updatedAt), TWO_MINUTES_IN_MILLISECONDS);
}
