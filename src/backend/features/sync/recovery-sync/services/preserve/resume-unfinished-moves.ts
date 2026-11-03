import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { SyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { RecoverySyncMove } from '@/infra/sqlite/schema';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { createRecoverySyncAbortError } from '../../common/create-recovery-sync-abort-error';
import { advanceMove } from './advance-move';

/**
 * v2.7.2 Alexis Mora
 * Finishes the moves a restart interrupted before the pass lists new items, so an item is never listed again
 * while its recorded move is still pending. Folders go first because their moves carry their files.
 * Returns the sources whose move failed, so they can be reported.
 */
export async function resumeUnfinishedMoves({ ctx }: { ctx: SyncContext }): Promise<Result<AbsolutePath[], Error>> {
  const failed: AbsolutePath[] = [];

  for (const itemType of ['folder', 'file'] as const) {
    const result = await resumeItemType({ ctx, itemType, failed });
    if (result.error) return Result.err(result.error);
  }

  return Result.ok(failed);
}

async function resumeItemType({
  ctx,
  itemType,
  failed,
}: {
  ctx: SyncContext;
  itemType: RecoverySyncMove['itemType'];
  failed: AbsolutePath[];
}): Promise<Result<void, Error>> {
  let afterUuid = '';
  let hasMore = true;

  while (hasMore) {
    if (ctx.abortController.signal.aborted) return Result.err(createRecoverySyncAbortError());

    const moves = SqliteModule.RecoverySyncModule.getUnfinishedMoves({ rootUuid: ctx.rootUuid, itemType, afterUuid });
    if (moves.error) return Result.err(moves.error);

    for (const move of moves.data) {
      const stage = await advanceMove({ ctx, move });
      if (stage.error) return Result.err(stage.error);
      if (stage.data === 'failed') failed.push(move.source as AbsolutePath);
    }

    afterUuid = moves.data.at(-1)?.uuid ?? afterUuid;
    hasMore = moves.data.length > 0;
  }

  return Result.ok(undefined);
}
