import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { MoveRepository } from '../../repository';
import { fileSchema, folderSchema } from '../../types';

/**
 * Applies the remote removal status only after contents are preserved and the original local version still matches.
 * Changed items become conflicts and retain their local state. Execute through accessDatabase with transaction: true.
 */
export function completeMove({ database, moveId }: { database: DatabaseSync; moveId: number }): Result<{ applied: boolean }> {
  const current = MoveRepository.getPreservingMove({ database, moveId });
  if (Result.isError(current)) return current;
  const move = current.data;
  if (move.stage === 'completed' || move.stage === 'conflict') return Result.ok({ applied: move.stage === 'completed' });
  if (move.stage !== 'moved') return Result.err(new Error('Recovery move must be preserved before changing local status'));
  const scanned = MoveRepository.getScan({ database, scanId: move.scanId });
  if (Result.isError(scanned)) return scanned;
  const scan = scanned.data;
  try {
    const schema = scan.itemType === 'file' ? fileSchema : folderSchema;
    schema.parse(JSON.parse(move.expected));
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
  const removed = MoveRepository.removeUnchangedItem({ database, scan, move });
  if (Result.isError(removed)) return removed;
  const applied = removed.data;
  const completed = MoveRepository.updateMoveResolution({ database, moveId, stage: applied ? 'completed' : 'conflict' });
  return Result.isError(completed) ? completed : Result.ok({ applied });
}
