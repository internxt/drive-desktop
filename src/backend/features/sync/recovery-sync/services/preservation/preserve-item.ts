import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { releaseMoveGuard } from '../../repository/release-move-guard';
import { accessDatabase } from '../../repository/storage';
import { completeGuardedMove } from './complete-guarded-move';
import { reserveMove } from './journal';
import { PreservationAdapters } from './types';

export type { PreservationAdapters } from './types';

/** Preserves one item and owns journal updates and guard release; failures retain durable state for retry. */
export async function preserveItem({
  adapters,
  ...input
}: Parameters<typeof reserveMove>[0] & {
  adapters: PreservationAdapters;
}): Promise<Result<{ applied: boolean }>> {
  try {
    const reserved = reserveMove(input);
    if (Result.isError(reserved)) return reserved;
    const move = reserved.data;
    if (move.watcherSettled === 1 && (move.stage === 'completed' || move.stage === 'conflict')) {
      return Result.ok({ applied: move.stage === 'completed' });
    }

    const guarded = await adapters.withMoveGuard({
      move,
      action: () => completeGuardedMove({ database: input.database, moveId: move.moveId, adapters }),
    });
    if (Result.isError(guarded)) return guarded;
    const released = accessDatabase({ database: input.database, action: releaseMoveGuard, input: { moveId: move.moveId } });
    if (Result.isError(released)) return released;
    return guarded;
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
}
