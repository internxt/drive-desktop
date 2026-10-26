import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { MoveRepository } from '../../repository';

/**
 * Records successful content preservation and counts it once, even when the same move is retried.
 * Execute through accessDatabase with transaction: true so move progress and the process count commit together.
 */
export function markMovePreserved({
  database,
  moveId,
  preservedFileCount,
}: {
  database: DatabaseSync;
  moveId: number;
  preservedFileCount: number;
}): Result<void> {
  if (!Number.isSafeInteger(preservedFileCount) || preservedFileCount < 0) return Result.err(new Error('Invalid preserved file count'));
  const current = MoveRepository.getPreservingMove({ database, moveId });
  if (Result.isError(current)) return current;
  const move = current.data;
  if (move.stage !== 'pending') {
    return move.preservedFileCount === preservedFileCount ? Result.ok(undefined) : Result.err(new Error('Recovery move count conflict'));
  }
  const recorded = MoveRepository.recordPreservedContents({ database, moveId, preservedFileCount });
  if (Result.isError(recorded)) return recorded;
  return MoveRepository.incrementPreservedFileCount({ database, scanId: move.scanId, preservedFileCount });
}
