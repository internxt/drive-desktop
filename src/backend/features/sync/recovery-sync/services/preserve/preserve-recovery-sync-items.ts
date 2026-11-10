import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { SyncContext } from '@/apps/sync-engine/config';
import { loadInMemoryPaths } from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { preserveFiles } from './preserve-files';
import { preserveFolders } from './preserve-folders';
import { PreserveRun } from './preserve-item';
import { resumeUnfinishedMoves } from './resume-unfinished-moves';

type Props = {
  ctx: SyncContext;
  startedAt: string;
  subfolder: string;
  rootPaths: AbsolutePath[];
};

/**
 * v2.7.2 Alexis Mora
 * Runs once every scan of the root completed, because the items to preserve are the ones the scans did not see existing.
 * Moves interrupted by a restart are finished first, then removed folders and then removed files.
 * Local paths are read from File Explorer once, after the interrupted moves, like the placeholder refresh does.
 * Returns the sources that could not be preserved; they stay in place with their status unchanged.
 */
export async function preserveRecoverySyncItems({ ctx, startedAt, subfolder, rootPaths }: Props): Promise<Result<AbsolutePath[], Error>> {
  const resumed = await resumeUnfinishedMoves({ ctx });
  if (resumed.error) return Result.err(resumed.error);

  const explorer = await loadExplorer({ ctx });
  if (explorer.error) return Result.err(explorer.error);

  const run: PreserveRun = { startedAt, subfolder, rootPaths, destinations: new Map() };

  const folders = await preserveFolders({ ctx, run, folders: explorer.data.folders });
  if (folders.error) return Result.err(folders.error);

  const files = await preserveFiles({ ctx, run, files: explorer.data.files, movedFolders: folders.data.moved });
  if (files.error) return Result.err(files.error);

  return Result.ok([...resumed.data, ...folders.data.failed, ...files.data]);
}

async function loadExplorer({ ctx }: { ctx: SyncContext }) {
  try {
    return Result.ok(await loadInMemoryPaths({ ctx }));
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error(String(cause));
    ctx.logger.error({ tag: 'RECOVERY-SYNC', msg: 'Error loading local paths for recovery sync', error });
    return Result.err(error);
  }
}
