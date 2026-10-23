import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';

/** Saves an outcome before notification is claimed; success requires the process to have reached reporting. */
export function saveOutcome({
  database,
  processId,
  outcome,
  message = null,
}: {
  database: DatabaseSync;
  processId: string;
  outcome: 'succeeded' | 'failed' | 'cancelled';
  message?: string | null;
}): Result<void> {
  const result = database
    .prepare(
      `UPDATE recovery_process SET outcome = ?, outcomeMessage = ?
      WHERE processId = ? AND stage != 'completed' AND notification = 'pending'
      AND (? != 'succeeded' OR stage = 'reporting')`,
    )
    .run(outcome, message, processId, outcome);
  return result.changes ? Result.ok(undefined) : Result.err(new Error('Recovery outcome conflict'));
}
