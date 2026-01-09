import { createOrUpdateFiles } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { FETCH_LIMIT_1000 } from '../store';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { GetFilesQuery } from '@/infra/drive-server-wip/services/files.service';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { SyncContext } from '@/apps/sync-engine/config';

type TProps = {
  ctx: SyncContext;
  from?: Date;
  offset?: number;
};

export async function syncRemoteFiles({ ctx, from, offset = 0 }: TProps) {
  let hasMore = true;

  while (hasMore) {
    /**
     * v2.5.0 Daniel Jiménez
     * We fetch ALL files when we want to synchronize the current state with the web state.
     * It means that we need to delete or create the files that are not in the web state anymore.
     * However, if no checkpoint is provided it means that we don't have a local state yet.
     * In that situation, fetch only EXISTS files.
     */
    const query: GetFilesQuery = {
      limit: FETCH_LIMIT_1000,
      offset,
      status: from ? 'ALL' : 'EXISTS',
      updatedAt: from?.toISOString(),
      sort: 'updatedAt',
      order: 'ASC',
    };

    const promise = ctx.workspaceId
      ? driveServerWip.workspaces.getFiles({ ctx, query })
      : driveServerWip.files.getFiles({ ctx, context: { query } });

    const { data: fileDtos, error: error1 } = await promise;

    if (error1) return;

    hasMore = fileDtos.length === FETCH_LIMIT_1000;
    offset += FETCH_LIMIT_1000;

    const { error: error2 } = await createOrUpdateFiles({ ctx, fileDtos });

    if (error2) return;

    const lastFile = fileDtos.at(-1);
    if (lastFile) {
      await SqliteModule.CheckpointModule.createOrUpdate({
        userUuid: ctx.userUuid,
        workspaceId: ctx.workspaceId,
        type: 'file',
        name: lastFile.plainName,
        updatedAt: lastFile.updatedAt,
      });
    }
  }
}
