import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { RecoveryMove } from '../../types';
import { markMovePreserved } from './journal';
import { PreservationAdapters } from './types';

export async function preservePendingMove({
  database,
  move,
  adapters,
}: {
  database: DatabaseSync;
  move: RecoveryMove;
  adapters: Pick<PreservationAdapters, 'preserveContents'>;
}): Promise<Result<void>> {
  if (move.stage !== 'pending') return Result.ok(undefined);

  let preserved: Result<{ preservedFileCount: number }>;
  try {
    preserved = await adapters.preserveContents({ move });
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
  if (Result.isError(preserved)) return preserved;

  return markMovePreserved({ database, moveId: move.moveId, preservedFileCount: preserved.data.preservedFileCount });
}
