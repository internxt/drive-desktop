import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { SyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { RecoverySyncMove, RecoverySyncMoveStage } from '@/infra/sqlite/schema';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { PreserveRun } from '../../constants';
import { advanceMove } from './advance-move';
import { allocateRecoveryDestination } from './allocate-recovery-destination';
import { getPreservedPath, getVolume } from './get-preserved-path';

type Props = {
  ctx: SyncContext;
  run: PreserveRun;
  itemType: RecoverySyncMove['itemType'];
  uuid: string;
  source: AbsolutePath;
  removalStatus: RecoverySyncMove['removalStatus'];
};

/**
 * v2.7.2 Alexis Mora
 * The move is recorded with the size and modification time the file has now, before anything is moved,
 * so a file the user edits from here on is detected and left in place.
 * An item that already has a move keeps it, so preserving it again only runs the steps it has left.
 */
export async function preserveItem({
  ctx,
  run,
  itemType,
  uuid,
  source,
  removalStatus,
}: Props): Promise<Result<RecoverySyncMoveStage, Error>> {
  const destination = await getDestination({ ctx, run, source });
  if (destination.error) return Result.err(destination.error);

  const preservedPath = getPreservedPath({
    rootPath: ctx.rootPath,
    rootPaths: run.rootPaths,
    sourcePath: source,
    destination: destination.data,
  });
  if (preservedPath.error) return Result.err(preservedPath.error);

  let fingerprint: Pick<RecoverySyncMove, 'sourceSize' | 'sourceModifiedAt'> = { sourceSize: null, sourceModifiedAt: null };
  if (itemType === 'file') {
    const stat = await fileSystem.stat({ absolutePath: source });
    if (stat.error) return Result.err(stat.error);
    fingerprint = { sourceSize: stat.data.size, sourceModifiedAt: stat.data.mtime.toISOString() };
  }

  const move = SqliteModule.RecoverySyncModule.reserveMove({
    rootUuid: ctx.rootUuid,
    itemType,
    uuid,
    source,
    destination: preservedPath.data,
    removalStatus,
    ...fingerprint,
  });
  if (move.error) return Result.err(move.error);

  return await advanceMove({ ctx, move: move.data, startedAt: run.startedAt });
}

async function getDestination({ ctx, run, source }: { ctx: SyncContext; run: PreserveRun; source: AbsolutePath }) {
  const volume = getVolume({ path: source });
  if (volume.error) return Result.err(volume.error);

  const cached = run.destinations.get(volume.data);
  if (cached) return Result.ok(cached);

  const allocated = await allocateRecoveryDestination({
    rootUuid: ctx.rootUuid,
    volume: volume.data,
    startedAt: run.startedAt,
    subfolder: run.subfolder,
  });
  if (allocated.data) run.destinations.set(volume.data, allocated.data);

  return allocated;
}
