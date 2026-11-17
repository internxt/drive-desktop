import { Result } from '@internxt/drive-desktop-core/build/common/result';
import pLimit from 'p-limit';
import { loadInMemoryPaths } from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { VIRTUAL_DRIVE_TREE_TRAVERSAL_CONCURRENCY } from '@/backend/features/virtual-drive/tree-traversal/concurrency';
import { traverse } from '@/context/virtual-drive/items/application/Traverser';
import { measurePerfomance } from '@/core/utils/measure-performance';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { SyncContext } from './config';

type Props = {
  ctx: SyncContext;
  isFirstExecution: boolean;
};

type RefreshResult = Result<boolean, Error>;
type Request = { isFirstExecution: boolean; resolvers: Array<(result: RefreshResult) => void> };
type Queue = { pending?: Request };

/**
 * v2.7.4 Victor Fernandez
 * Startup, remote sync and recovery sync can ask for a refresh at the same time, and every pass loads the whole
 * database in memory, so overlapping passes crashed the app with out of memory on big accounts.
 * Only one pass runs per context. Requests that arrive meanwhile are merged into a single pass that starts after it,
 * not answered with the running one, because they may come from database changes that pass did not see.
 */
const queues = new WeakMap<SyncContext, Queue>();

export function refreshItemPlaceholders({ ctx, isFirstExecution }: Props): Promise<RefreshResult> {
  return new Promise((resolve) => {
    const queue = queues.get(ctx);

    if (queue) {
      queue.pending ??= { isFirstExecution: false, resolvers: [] };
      queue.pending.isFirstExecution ||= isFirstExecution;
      queue.pending.resolvers.push(resolve);
      return;
    }

    const newQueue: Queue = { pending: { isFirstExecution, resolvers: [resolve] } };
    queues.set(ctx, newQueue);
    void runQueue({ ctx, queue: newQueue });
  });
}

async function runQueue({ ctx, queue }: { ctx: SyncContext; queue: Queue }) {
  while (queue.pending) {
    const { isFirstExecution, resolvers } = queue.pending;
    queue.pending = undefined;

    const result = ctx.abortController.signal.aborted ? Result.err(createAbortError()) : await runPass({ ctx, isFirstExecution });
    for (const resolve of resolvers) resolve(result);
  }

  queues.delete(ctx);
}

function createAbortError() {
  const error = new Error('Refresh item placeholders was aborted');
  error.name = 'AbortError';
  return error;
}

async function runPass({ ctx, isFirstExecution }: Props): Promise<RefreshResult> {
  try {
    const time = await measurePerfomance(async () => {
      const [database, fileExplorer] = await Promise.all([getDatabaseItems({ ctx }), loadInMemoryPaths({ ctx })]);

      ctx.logger.debug({
        msg: 'Refresh item placeholders',
        isFirstExecution,
        database: {
          files: database.files.length,
          folders: database.folders.length,
        },
        fileExplorer: {
          files: fileExplorer.files.size,
          folders: fileExplorer.folders.size,
        },
      });

      const currentFolder = { absolutePath: ctx.rootPath, uuid: ctx.rootUuid };

      await traverse({
        ctx,
        currentFolder,
        database,
        fileExplorer,
        isFirstExecution,
        limit: pLimit(VIRTUAL_DRIVE_TREE_TRAVERSAL_CONCURRENCY),
      });
    });

    ctx.logger.debug({ msg: 'Finish refresh placeholders in seconds', time });
    return Result.ok(true);
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error(String(cause));
    ctx.logger.error({ msg: 'Error refreshing item placeholders', error });
    return Result.err(error);
  }
}

function getDatabaseItems({ ctx }: { ctx: SyncContext }) {
  const { data = { files: [], folders: [] } } = SqliteModule.SubtreeModule.getSubtree({ ...ctx });
  return data;
}
