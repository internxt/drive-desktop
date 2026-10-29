import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { sleep } from '@/apps/main/util';
import { SyncContext } from '@/apps/sync-engine/config';
import { DriveServerWipError } from '@/infra/drive-server-wip/defs';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { createRecoverySyncAbortError } from '../../common/create-recovery-sync-abort-error';
import { EPOCH } from '../../constants';
import { RecoverySyncPageRequest } from './fetch-recovery-sync-page';
import { RecoverySyncPage } from './map-recovery-sync-page';

type RemoteItem = {
  uuid: string;
  status: 'EXISTS' | 'TRASHED' | 'DELETED';
  updatedAt: string;
};

type Props<T extends RemoteItem> = {
  ctx: SyncContext;
  itemType: 'file' | 'folder';
  fetchPage: (props: { request: RecoverySyncPageRequest }) => Promise<Result<RecoverySyncPage<T>, Error>>;
  repairItems: (props: { items: T[]; checkpoint: string }) => Promise<Result<void, Error>>;
};

type ScanState = {
  updatedAt: string;
  cursor: string | null;
  completed: boolean;
  restartedAt?: string;
};

type PageProps<T extends RemoteItem> = Props<T> & {
  checkpoint: string;
  state: ScanState;
};

/**
 * v2.7.2 Alexis Mora
 * Each page is repaired and then committed with its observations before the next request,
 * so an interrupted scan resumes from the last committed timestamp without losing observations.
 * The cursor lives only in memory: it is opaque and a resumed process starts a new traversal from the saved timestamp.
 * The normal checkpoint is never written here; normal sync owns it.
 */
export async function scanRecoverySyncItems<T extends RemoteItem>(props: Props<T>): Promise<Result<void, Error>> {
  const { ctx, itemType } = props;

  const scan = SqliteModule.RecoverySyncModule.startOrResumeScan({
    rootUuid: ctx.rootUuid,
    userUuid: ctx.userUuid,
    workspaceId: ctx.workspaceId,
    itemType,
  });

  if (scan.error?.code === 'NOT_FOUND') {
    ctx.logger.debug({ msg: 'Recovery sync scan skipped without a checkpoint', itemType });
    return Result.ok(undefined);
  }

  if (scan.error) return Result.err(scan.error);

  return await scanUntilCompleted({
    ...props,
    checkpoint: scan.data.checkpoint,
    state: { updatedAt: scan.data.updatedAt, cursor: null, completed: scan.data.completed === 1 },
  });
}

async function scanUntilCompleted<T extends RemoteItem>(props: PageProps<T>): Promise<Result<void, Error>> {
  const { signal } = props.ctx.abortController;
  let { state } = props;

  while (!state.completed) {
    if (signal.aborted) return Result.err(createRecoverySyncAbortError());

    const result = await scanPage({ ...props, state });
    if (result.error) return Result.err(result.error);

    state = result.data;
  }

  return Result.ok(undefined);
}

/**
 * v2.7.2 Alexis Mora
 * The backend returns items strictly updated after `updatedAt`, so restarting from the saved timestamp itself would skip
 * the rest of a group of items sharing it whose first part was committed before the interruption.
 * Stepping back one millisecond replays that group, and commitScanPage accepts the replay because progress never moves backwards.
 */
function getRequest({ state }: { state: ScanState }): RecoverySyncPageRequest {
  if (state.cursor) return { cursor: state.cursor };
  if (state.updatedAt === EPOCH) return { updatedAt: state.updatedAt };
  return { updatedAt: new Date(Date.parse(state.updatedAt) - 1).toISOString() };
}

/**
 * v2.7.2 Alexis Mora
 * The backend rejects a cursor it cannot decode with a 400. The cursor is never persisted, so the scan can restart
 * from the saved timestamp instead of failing. Restarting only after progress since the previous restart avoids
 * looping on a cursor the backend keeps rejecting.
 */
function canRestart({ state, error }: { state: ScanState; error: Error }) {
  return (
    state.cursor !== null && state.restartedAt !== state.updatedAt && error instanceof DriveServerWipError && error.response?.status === 400
  );
}

async function scanPage<T extends RemoteItem>({
  ctx,
  itemType,
  fetchPage,
  repairItems,
  checkpoint,
  state,
}: PageProps<T>): Promise<Result<ScanState, Error>> {
  const { signal } = ctx.abortController;

  const page = await fetchPage({ request: getRequest({ state }) });
  if (signal.aborted) return Result.err(createRecoverySyncAbortError());

  if (page.error) {
    if (canRestart({ state, error: page.error })) {
      ctx.logger.debug({ msg: 'Recovery sync scan cursor rejected, restarting from saved progress', itemType, updatedAt: state.updatedAt });
      return Result.ok({ ...state, cursor: null, restartedAt: state.updatedAt });
    }

    ctx.logger.error({ msg: 'Error fetching recovery sync scan page', itemType, error: page.error });
    return Result.err(page.error);
  }

  const { items, nextCursor } = page.data;

  const repair = await repairItems({ items, checkpoint });
  if (repair.error) {
    ctx.logger.error({ msg: 'Error repairing recovery sync scan page', itemType, error: repair.error });
    return Result.err(repair.error);
  }

  if (signal.aborted) return Result.err(createRecoverySyncAbortError());

  const updatedAt = items.at(-1)?.updatedAt ?? state.updatedAt;
  const completed = nextCursor === null;

  const commit = SqliteModule.RecoverySyncModule.commitScanPage({
    rootUuid: ctx.rootUuid,
    itemType,
    items: items.map(({ uuid, status }) => ({ uuid, remoteStatus: status })),
    updatedAt,
    completed,
  });

  if (commit.error) {
    ctx.logger.error({ msg: 'Error committing recovery sync scan page', itemType, error: commit.error });
    return Result.err(commit.error);
  }

  return Result.ok({ ...state, updatedAt, cursor: nextCursor, completed });
}
