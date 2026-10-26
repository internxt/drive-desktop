import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { ProcessRepository, ScanRepository } from '../../repository';
import { RecoveryContext, RecoveryProcess } from '../../types';

/**
 * Prepares recovery state for the Drive identified by `ctx.rootUuid`.
 *
 * A new process saves `startedAt` and registers separate file and folder scans using the context's user and workspace.
 * Each scan captures its normal sync checkpoint to protect newer local work.
 * Item types without a checkpoint are left to initial sync.
 *
 * If this root already has an unfinished process, returns its existing state.
 *
 * Execute through `accessDatabase` with `transaction: true` so a failed scan registration
 * rolls back the process and any scans already inserted.
 */
export function createOrResumeProcess({
  database,
  ctx,
  startedAt,
}: {
  database: DatabaseSync;
  ctx: RecoveryContext;
  startedAt: string;
}): Result<RecoveryProcess, Error> {
  const existing = ProcessRepository.getProcess({ database, rootUuid: ctx.rootUuid });
  if (Result.isError(existing)) {
    return existing;
  }
  if (existing.data) {
    return Result.ok(existing.data);
  }

  const process = ProcessRepository.insertProcess({ database, rootUuid: ctx.rootUuid, startedAt });
  if (Result.isError(process)) {
    return process;
  }

  for (const itemType of ['file', 'folder'] as const) {
    const scan = ScanRepository.insertScanFromCheckpoint({ database, ctx, itemType });
    if (Result.isError(scan)) {
      return scan;
    }
  }
  return process;
}
