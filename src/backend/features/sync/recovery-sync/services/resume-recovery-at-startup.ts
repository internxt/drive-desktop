import { getSyncContexts } from '@/apps/main/remote-sync/store';
import { SyncContext } from '@/apps/sync-engine/config';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { RecoverySyncSwitch } from './recovery-sync-switch';
import { runRecoveryWithPreservation } from './run-recovery-with-preservation';

/**
 * v2.7.2 Alexis Mora
 * Normal sync must not run between an interrupted recovery and its end, because the recovery may have moved
 * items whose removal is not saved yet. Checked when the worker spawns, so its first sync can be held back.
 */
export function shouldResumeRecovery({ ctx }: { ctx: SyncContext }) {
  if (!RecoverySyncSwitch.isPreservationEnabled()) return false;

  const { data } = SqliteModule.RecoverySyncModule.hasUnfinishedRecovery({ rootUuid: ctx.rootUuid });
  return data === true;
}

/**
 * v2.7.2 Alexis Mora
 * Runs once every worker spawned, so the workspace subfolders and sync roots are those of every context,
 * while only the contexts with an interrupted recovery are resumed. They keep the start date they had,
 * and the outcome of the interrupted run is reported now that it ends.
 */
export async function resumeRecoveryAtStartup() {
  const allContexts = getSyncContexts();
  const contexts = allContexts.filter((ctx) => shouldResumeRecovery({ ctx }));
  if (contexts.length === 0) return;

  for (const ctx of contexts) {
    ctx.logger.debug({ tag: 'RECOVERY-SYNC', msg: 'Resuming interrupted recovery sync' });
  }

  await runRecoveryWithPreservation({ contexts, allContexts });
}
