import { SyncContext } from '@/apps/sync-engine/config';

const running = new Set<string>();

/**
 * v2.7.3 Alexis Mora
 * A manual run can start while the workers are still spawning, before the startup resume. The resume then finds the
 * progress that run saved, cannot tell it from an interrupted one, and starts a second run on the same root, so both
 * commit scan pages and the one behind fails with INVALID_PROGRESS. The sync status cannot tell them apart either,
 * because a root waiting for its resume is already marked as syncing.
 * It lives in memory on purpose: after a restart nothing is running, so saved progress always means an interrupted run.
 */
export function isRecoveryRunning({ ctx }: { ctx: SyncContext }) {
  return running.has(ctx.rootUuid);
}

export function markRecoveriesRunning({ contexts }: { contexts: SyncContext[] }) {
  for (const ctx of contexts) running.add(ctx.rootUuid);
}

export function markRecoveriesStopped({ contexts }: { contexts: SyncContext[] }) {
  for (const ctx of contexts) running.delete(ctx.rootUuid);
}
