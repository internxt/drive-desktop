import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { SyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { PreservationSummary } from '@/infra/sqlite/services/recovery-sync/get-preservation-summary';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { preserveRecoverySyncItems } from './preserve/preserve-recovery-sync-items';
import { scanRecoverySync } from './scan/scan-recovery-sync';

export type ContextOutcome = PreservationSummary & {
  failed: AbsolutePath[];
};

type Props = {
  ctx: SyncContext;
  startedAt: string;
  subfolder: string;
  rootPaths: AbsolutePath[];
};

/**
 * v2.7.2 Alexis Mora
 * Recovery of one sync context: scan every remote item, then preserve the local items the cloud no longer has.
 * The process keeps the startedAt of its first attempt, so a resumed context keeps its dated folder.
 * A context without a checkpoint never completes its scans and is left to normal sync, so nothing is preserved.
 * The recovery state is not cleared here: the caller clears it once the run is reported,
 * so the outcome of moves made before a restart is still counted.
 */
export async function recoverAndPreserve({ ctx, startedAt, subfolder, rootPaths }: Props): Promise<Result<ContextOutcome, Error>> {
  const { rootUuid } = ctx;

  const process = SqliteModule.RecoverySyncModule.startOrResumeProcess({ rootUuid, startedAt });
  if (process.error) return Result.err(process.error);

  const scan = await scanRecoverySync({ ctx });
  if (scan.error) return Result.err(scan.error);

  const completed = SqliteModule.RecoverySyncModule.areScansCompleted({ rootUuid });
  if (completed.error) return Result.err(completed.error);

  let failed: AbsolutePath[] = [];
  if (completed.data) {
    const preserved = await preserveRecoverySyncItems({ ctx, startedAt: process.data.startedAt, subfolder, rootPaths });
    if (preserved.error) return Result.err(preserved.error);
    failed = preserved.data;
  }

  const summary = SqliteModule.RecoverySyncModule.getPreservationSummary({ rootUuid });
  if (summary.error) return Result.err(summary.error);

  ctx.logger.debug({ tag: 'RECOVERY-SYNC', msg: 'Recovery sync context finished', preserved: summary.data.preserved, failed: failed.length });
  return Result.ok({ ...summary.data, failed });
}
