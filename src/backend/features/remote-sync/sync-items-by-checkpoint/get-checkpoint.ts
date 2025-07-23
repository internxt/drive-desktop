import { getUserOrThrow } from '@/apps/main/auth/service';
import { rewind, TWO_MINUTES_IN_MILLISECONDS } from '@/apps/main/remote-sync/helpers';
import { LokijsModule } from '@/infra/lokijs/lokijs.module';

type TProps = {
  type: 'file' | 'folder';
  workspaceId: string;
};

export async function getCheckpoint({ type, workspaceId }: TProps) {
  const user = getUserOrThrow();
  const userUuid = user.uuid;

  const { data: checkpoint } = await LokijsModule.CheckpointsModule.getCheckpoint({ userUuid, type, workspaceId });

  if (!checkpoint) return;

  return rewind(new Date(checkpoint), TWO_MINUTES_IN_MILLISECONDS);
}
