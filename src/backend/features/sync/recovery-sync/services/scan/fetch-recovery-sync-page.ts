import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { FETCH_LIMIT_1000 } from '@/apps/main/remote-sync/store';
import { SyncContext } from '@/apps/sync-engine/config';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import {
  mapRecoverySyncFilesPage,
  mapRecoverySyncFoldersPage,
  RecoverySyncFile,
  RecoverySyncFolder,
  RecoverySyncPage,
} from './map-recovery-sync-page';

export type RecoverySyncPageRequest = { updatedAt: string } | { cursor: string };

type Props = {
  ctx: SyncContext;
  request: RecoverySyncPageRequest;
};

/**
 * v2.7.2 Alexis Mora
 * The core sync request adds `status: 'EXISTS'` to traversals that start at the epoch,
 * but recovery sync starts at the epoch and needs TRASHED and DELETED items too, so it builds its own query without a status filter.
 */
function getQuery({ request }: { request: RecoverySyncPageRequest }) {
  return { ...request, limit: FETCH_LIMIT_1000 };
}

export async function fetchRecoverySyncFilesPage({ ctx, request }: Props): Promise<Result<RecoverySyncPage<RecoverySyncFile>, Error>> {
  try {
    const context = { query: getQuery({ request }) };
    const result = ctx.workspaceId
      ? await driveServerWip.workspaces.getFilesSyncPage({ ctx, context, skipLog: true })
      : await driveServerWip.files.getFilesSyncPage({ ctx, context, skipLog: true });

    if (result.error) return Result.err(result.error);
    return mapRecoverySyncFilesPage({ page: result.data });
  } catch (error) {
    return Result.err(error instanceof Error ? error : new Error('Unexpected error fetching recovery sync files page', { cause: error }));
  }
}

export async function fetchRecoverySyncFoldersPage({ ctx, request }: Props): Promise<Result<RecoverySyncPage<RecoverySyncFolder>, Error>> {
  try {
    const context = { query: getQuery({ request }) };
    const result = ctx.workspaceId
      ? await driveServerWip.workspaces.getFoldersSyncPage({ ctx, context, skipLog: true })
      : await driveServerWip.folders.getFoldersSyncPage({ ctx, context, skipLog: true });

    if (result.error) return Result.err(result.error);
    return mapRecoverySyncFoldersPage({ page: result.data });
  } catch (error) {
    return Result.err(error instanceof Error ? error : new Error('Unexpected error fetching recovery sync folders page', { cause: error }));
  }
}
