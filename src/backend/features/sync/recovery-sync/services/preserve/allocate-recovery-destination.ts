import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { getRecoveryDestination } from './get-recovery-destination';

const MAX_ATTEMPTS = 100;

type Props = {
  rootUuid: string;
  volume: string;
  startedAt: string;
  subfolder: string;
};

/**
 * v2.7.2 Alexis Mora
 * A candidate that already exists on disk belongs to an earlier run or to the user, so it is skipped
 * and recovery never mixes its items with contents it did not create.
 * The first path recorded for the root and volume wins, so after a restart the recorded path is returned
 * even though the candidates checked now are different because the recorded one exists on disk.
 * Nothing is created here: the folders are created by the first move into them.
 */
export async function allocateRecoveryDestination({ rootUuid, volume, startedAt, subfolder }: Props): Promise<Result<AbsolutePath, Error>> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const path = getRecoveryDestination({ volume, startedAt, subfolder, attempt });
    const { error } = await fileSystem.stat({ absolutePath: path });

    if (!error) continue;
    if (error.code !== 'NON_EXISTS') return Result.err(error);

    const allocated = SqliteModule.RecoverySyncModule.allocateDestination({ rootUuid, volume, path });
    if (allocated.error) return Result.err(allocated.error);

    return Result.ok(allocated.data.path as AbsolutePath);
  }

  return Result.err(new Error('No free recovery sync destination'));
}
