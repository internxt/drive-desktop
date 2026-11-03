import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { dirname } from 'node:path/posix';
import { SyncContext } from '@/apps/sync-engine/config';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { createRecoverySyncAbortError } from '../common/create-recovery-sync-abort-error';
import { reportPreservationIssues } from './notification/report-preservation-issues';
import { RecoverySyncOutcome, showRecoverySyncNotification } from './notification/show-recovery-sync-notification';
import { getRecoverySubfolders } from './preserve/get-recovery-subfolders';
import { ContextOutcome, recoverAndPreserve } from './recover-and-preserve';
import { recoverContext } from './recover-context';

type Props = {
  contexts: SyncContext[];
};

/**
 * v2.7.2 Alexis Mora
 * The start date is taken once, so every context of the run shares the same dated folder.
 * A context whose recovery finished is cleared even when some items could not be preserved,
 * so the next run scans again from the epoch and retries them. A context that stopped keeps its state to resume it.
 * Logout aborts every context and owns the app state from then on, so nothing is reported for it.
 */
export async function runRecoveryWithPreservation({ contexts }: Props): Promise<Result<boolean, Error>> {
  const startedAt = new Date().toISOString();
  const subfolders = await getContextSubfolders({ contexts });
  const rootPaths = contexts.map(({ rootPath }) => rootPath);
  const outcomes: ContextOutcome[] = [];

  const results = await Promise.all(
    contexts.map((ctx) =>
      recoverContext({
        ctx,
        recover: async () => {
          const subfolder = subfolders.get(ctx.workspaceId) ?? ctx.workspaceId;
          const outcome = await recoverAndPreserve({ ctx, startedAt, subfolder, rootPaths });
          if (outcome.data) {
            const destinations = outcome.data.destinations.map((path) => (subfolder ? dirname(path) : path));
            outcomes.push({ ...outcome.data, destinations });
          }
          return outcome;
        },
      }),
    ),
  );

  if (contexts.some((ctx) => ctx.abortController.signal.aborted)) return Result.err(createRecoverySyncAbortError());

  contexts.forEach((ctx, index) => {
    if (!results[index].error) SqliteModule.RecoverySyncModule.clearRecovery({ rootUuid: ctx.rootUuid });
  });

  const errors = results.flatMap(({ error }) => (error ? [error] : []));
  reportPreservationIssues({ failed: outcomes.flatMap((outcome) => outcome.failed) });
  showRecoverySyncNotification(getOutcome({ errors, outcomes }));

  return errors.length > 0 ? Result.err(errors[0]) : Result.ok(true);
}

function getOutcome({ errors, outcomes }: { errors: Error[]; outcomes: ContextOutcome[] }): RecoverySyncOutcome {
  const preserved = outcomes.reduce((total, outcome) => total + outcome.preserved, 0);
  const destinations = [...new Set(outcomes.flatMap((outcome) => outcome.destinations))].toSorted((a, b) => a.localeCompare(b));

  if (errors.some((error) => error.name === 'AbortError')) return { status: 'cancelled', preserved, destinations };
  if (errors.length > 0 || outcomes.some((outcome) => outcome.failed.length > 0)) return { status: 'failed', preserved, destinations };
  return { status: 'completed', preserved, destinations };
}

/**
 * v2.7.2 Alexis Mora
 * Workspace names are only needed for folder names, so if they cannot be read the workspace id is used instead.
 */
async function getContextSubfolders({ contexts }: Props) {
  const workspaceIds = contexts.map(({ workspaceId }) => workspaceId).filter(Boolean);
  if (workspaceIds.length === 0) return getRecoverySubfolders({ workspaces: [] });

  const { data } = await driveServerWipModule.workspaces.getWorkspaces({ ctx: contexts[0] });
  const names = new Map(data?.availableWorkspaces.map(({ workspace }) => [workspace.id, workspace.name]));

  return getRecoverySubfolders({ workspaces: workspaceIds.map((id) => ({ id, name: names.get(id) ?? '' })) });
}
