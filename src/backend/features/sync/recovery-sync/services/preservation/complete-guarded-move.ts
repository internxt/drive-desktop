import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { MoveRepository } from '../../repository';
import { accessDatabase } from '../../repository/storage';
import { completeMove } from './complete-move';
import { preservePendingMove } from './preserve-pending-move';
import { PreservationAdapters } from './types';

export async function completeGuardedMove({
  database,
  moveId,
  adapters,
}: {
  database: DatabaseSync;
  moveId: number;
  adapters: Pick<PreservationAdapters, 'preserveContents'>;
}): Promise<Result<{ applied: boolean }>> {
  // v2.7.1: another guarded retry may have finished while this call waited for the source lock.
  const current = MoveRepository.getMove({ database, moveId });
  if (Result.isError(current)) return current;

  const preserved = await preservePendingMove({ database, move: current.data, adapters });
  if (Result.isError(preserved)) return preserved;

  return accessDatabase({ database, action: completeMove, input: { moveId }, transaction: true });
}
