import { RemoteSyncManager } from '../RemoteSyncManager';
import { FETCH_LIMIT } from '../store';
import { syncRemoteFile } from './sync-remote-file';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { LokijsModule } from '@/infra/lokijs/lokijs.module';

type TProps = {
  self: RemoteSyncManager;
  from?: Date;
  offset?: number;
};

export async function syncRemoteFiles({ self, from, offset = 0 }: TProps) {
  let hasMore = true;

  while (hasMore) {
    /**
     * v2.5.0 Daniel Jiménez
     * We fetch ALL files when we want to synchronize the current state with the web state.
     * It means that we need to delete or create the files that are not in the web state anymore.
     * However, if no checkpoint is provided it means that we don't have a local state yet.
     * In that situation, fetch only EXISTS files.
     */
    const query = {
      limit: FETCH_LIMIT,
      offset,
      status: from ? ('ALL' as const) : ('EXISTS' as const),
      updatedAt: from?.toISOString(),
    };

    const promise = self.workspaceId
      ? driveServerWip.workspaces.getFilesInWorkspace({ workspaceId: self.workspaceId, query })
      : driveServerWip.files.getFiles({ query });

    const { data, error } = await promise;

    if (!data) throw error;

    hasMore = data.length === FETCH_LIMIT;
    offset += FETCH_LIMIT;

    await Promise.all(
      data.map(async (remoteFile) => {
        await syncRemoteFile({ self, remoteFile });
      }),
    );

    const lastFile = data.at(-1);
    if (lastFile) {
      await LokijsModule.CheckpointsModule.updateCheckpoint({
        userUuid: self.context.userUuid,
        workspaceId: self.workspaceId,
        type: 'file',
        plainName: lastFile.plainName,
        checkpoint: lastFile.updatedAt,
      });
    }
  }
}
