import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { Stats } from 'node:fs';
import { SyncContext } from '@/apps/sync-engine/config';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { RecoverySyncMove, RecoverySyncMoveStage } from '@/infra/sqlite/schema';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

type Props = {
  ctx: SyncContext;
  move: RecoverySyncMove;
  /** When the recovery started, anything inside a folder changed since then belongs to normal sync. */
  startedAt: string;
};

/**
 * v2.7.2 Alexis Mora
 * Runs the steps left of a recorded move, so the same function moves a new item and resumes an interrupted one.
 * Every step is saved before the next one starts, so a restart repeats at most the step that was running.
 * Returns the stage the move ended in.
 */
export async function advanceMove({ ctx, move, startedAt }: Props): Promise<Result<RecoverySyncMoveStage, Error>> {
  const { rootUuid, itemType, uuid } = move;
  let stage = move.stage;

  if (stage === 'reserved') {
    stage = await moveSource({ ctx, move, startedAt });
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
 * The destination is allocated for this move only, so if it exists while the source is gone the move already happened
 * before an interruption. When both exist it cannot be told whether the destination is this item or something else,
 * so the source is left in place and the item stays in the Drive.
 * A source that changed since the move was recorded is left in place, so newer local work stays in the Drive.
 */
async function moveSource({ ctx, move, startedAt }: Props): Promise<'moved' | 'conflict' | 'failed'> {
  const { source, destination } = move;

  const destinationStat = await fileSystem.stat({ absolutePath: destination });
  const sourceStat = await fileSystem.stat({ absolutePath: source });

  if (destinationStat.data) {
    if (!sourceStat.data) return 'moved';
    ctx.logger.error({ msg: 'Recovery sync source and destination both exist, leaving the source in place', source, destination });
    return 'conflict';
  }

  if (sourceStat.error) {
    ctx.logger.error({ msg: 'Recovery sync source not found to preserve', source, destination, error: sourceStat.error });
    return 'failed';
  }

  if (await hasChanged({ move, path: source, startedAt })) {
    ctx.logger.debug({ msg: 'Recovery sync source changed, leaving it in place', source });
    return 'conflict';
  }

  const error = await fileSystem.moveWithoutOverwrite({ source, destination });
  if (error) {
    ctx.logger.error({ msg: 'Error preserving recovery sync item', source, destination, error });
    return 'failed';
  }

  /**
   * v2.7.2 Alexis Mora
   * A file written between the check and the rename would leave the Drive with the new work in it, so the moved
   * copy is checked again and put back when it changed. Rename keeps the size and modification time of a file.
   */
  if (move.itemType === 'file' && (await hasChanged({ move, path: destination, startedAt }))) {
    const restoreError = await fileSystem.moveWithoutOverwrite({ source: destination, destination: source });
    ctx.logger.error({ msg: 'Recovery sync source changed while moving it', source, destination, error: restoreError });
    return 'conflict';
  }

  return 'moved';
}

/**
 * v2.7.2 Alexis Mora
 * A file is compared with the size and modification time recorded with its move. A folder has none,
 * so it changed when anything inside it was created or modified after the recovery started.
 * Anything that cannot be read counts as changed, so it stays in the Drive.
 */
async function hasChanged({ move, path, startedAt }: { move: RecoverySyncMove; path: string; startedAt: string }) {
  if (move.itemType === 'file') {
    if (move.sourceSize === null) return false;
    const { data: stats } = await fileSystem.stat({ absolutePath: path });
    return !stats || stats.size !== move.sourceSize || stats.mtime.toISOString() !== move.sourceModifiedAt;
  }

  try {
    const since = new Date(startedAt).getTime();
    const children = await fileSystem.walk({ rootFolder: path });
    for (const entry of [path, ...children.map(({ absolutePath }) => absolutePath)]) {
      const { data: stats } = await fileSystem.stat({ absolutePath: entry });
      if (!stats || isAfter({ stats, since })) return true;
    }
    return false;
  } catch {
    return true;
  }
}

function isAfter({ stats, since }: { stats: Stats; since: number }) {
  return stats.mtime.getTime() >= since || stats.birthtime.getTime() >= since;
}
