import { rewind, TWO_MINUTES_IN_MILLISECONDS } from '@/apps/main/remote-sync/helpers';
import { Config } from '@/apps/sync-engine/config';
import { LokijsModule } from '@/infra/lokijs/lokijs.module';

type TProps = {
  ctx: Config;
  type: 'file' | 'folder';
};

export async function getCheckpoint({ ctx, type }: TProps) {
  const { data: checkpoint } = await LokijsModule.CheckpointsModule.getCheckpoint({
    userUuid: ctx.userUuid,
    workspaceId: ctx.workspaceId,
    type,
  });

  if (!checkpoint) return;

  return rewind(new Date(checkpoint), TWO_MINUTES_IN_MILLISECONDS);
}
