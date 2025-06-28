import { getUserOrThrow } from '@/apps/main/auth/service';
import { driveFilesCollection, driveFoldersCollection } from '@/apps/main/remote-sync/store';
import { rewind, TWO_MINUTES_IN_MILLISECONDS } from '@/apps/main/remote-sync/helpers';
import { LokijsModule } from '@/infra/lokijs/lokijs.module';

type TProps = {
  type: 'file' | 'folder';
  workspaceId: string;
};

export async function getCheckpoint({ type, workspaceId }: TProps) {
  const user = getUserOrThrow();
  const userUuid = user.uuid;

  let { data: checkpoint } = await LokijsModule.CheckpointsModule.getCheckpoint({ userUuid, type, workspaceId });

  if (!checkpoint) {
    if (type === 'file') {
      const result = await driveFilesCollection.getLastUpdatedByWorkspace({ userUuid, workspaceId });
      if (!result) return;
      checkpoint = result.updatedAt;
    } else {
      const result = await driveFoldersCollection.getLastUpdatedByWorkspace({ userUuid, workspaceId });
      if (!result) return;
      checkpoint = result.updatedAt;
    }
  }

  return rewind(new Date(checkpoint), TWO_MINUTES_IN_MILLISECONDS);
}
