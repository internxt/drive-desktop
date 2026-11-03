import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { Stats } from 'node:fs';
import { SyncContext } from '@/apps/sync-engine/config';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { RecoverySyncMove, RecoverySyncMoveStage } from '@/infra/sqlite/schema';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

type Props = {
  ctx: SyncContext;
  move: RecoverySyncMove;
};

/**
 * v2.7.2 Alexis Mora
 * Runs the steps left of a recorded move, so the same function moves a new item and resumes an interrupted one.
 * Every step is saved before the next one starts, so a restart repeats at most the step that was running.
 * Returns the stage the move ended in.
 */
export async function advanceMove({ ctx, move }: Props): Promise<Result<RecoverySyncMoveStage, Error>> {
  const { rootUuid, itemType, uuid } = move;
  let stage = move.stage;

  if (stage === 'reserved') {
    stage = await moveSource({ ctx, move });
    const saved = SqliteModule.RecoverySyncModule.setMoveStage({ rootUuid, itemType, uuid, stage });
    if (saved.error) return Result.err(saved.error);
  }

  if (stage !== 'moved') return Result.ok(stage);

  /**
   * v2.7.2 Alexis Mora
   * The contents are already preserved at this point. When the local item changed since it was listed,
   * for example because normal sync updated it, the removal is skipped and normal sync keeps owning the item.
   */
  const removed = SqliteModule.RecoverySyncModule.markRemovedIfEligible({
    rootUuid,
    userUuid: ctx.userUuid,
    workspaceId: ctx.workspaceId,
    itemType,
    uuid,
    removalStatus: move.removalStatus,
  });
  if (removed.error) return Result.err(removed.error);

  stage = removed.data ? 'done' : 'conflict';
  const saved = SqliteModule.RecoverySyncModule.setMoveStage({ rootUuid, itemType, uuid, stage });
  if (saved.error) return Result.err(saved.error);

  return Result.ok(stage);
}

/**
 * v2.7.2 Alexis Mora
 * The destination is allocated for this move only, so if it exists the move already happened before an interruption,
 * and a source found again at its old path is a new item that belongs to normal sync.
 * A source that changed since the move was recorded is left in place, so newer local work stays in the Drive.
 */
async function moveSource({ ctx, move }: Props): Promise<'moved' | 'conflict' | 'failed'> {
  const { source, destination } = move;

  const destinationStat = await fileSystem.stat({ absolutePath: destination });
  if (destinationStat.data) return 'moved';

  const sourceStat = await fileSystem.stat({ absolutePath: source });
  if (sourceStat.error) {
    ctx.logger.error({ msg: 'Recovery sync source not found to preserve', source, destination, error: sourceStat.error });
    return 'failed';
  }

  if (hasChanged({ move, stats: sourceStat.data })) {
    ctx.logger.debug({ msg: 'Recovery sync source changed, leaving it in place', source });
    return 'conflict';
  }

  const error = await fileSystem.moveWithoutOverwrite({ source, destination });
  if (error) {
    ctx.logger.error({ msg: 'Error preserving recovery sync item', source, destination, error });
    return 'failed';
  }

  return 'moved';
}

function hasChanged({ move, stats }: { move: RecoverySyncMove; stats: Stats }) {
  if (move.sourceSize === null) return false;
  return stats.size !== move.sourceSize || stats.mtime.toISOString() !== move.sourceModifiedAt;
}
