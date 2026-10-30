import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { RemoteTree } from '@/apps/backups/remote-tree/traverser';
import { sleep } from '@/apps/main/util';
import { Sync } from '@/backend/features/sync';
import { RetryLater } from '@/backend/features/sync/actions/services/upload-file';
import { dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { getWorkerCount } from '@/core/utils/concurrency';
import { stat } from '@/infra/file-system/original-fs';
import { StatItem } from '@/infra/file-system/services/stat-readdir';
import { scheduleRequest } from '../schedule-request';
import { trackRetry } from './track-retry';

type Props = {
  ctx: BackupsContext;
  remoteTree: RemoteTree;
  added: StatItem[];
};

type PendingFile = {
  path: AbsolutePath;
  attempt: number;
  retryAt: number;
};

const CREATE_FILES_CONCURRENCY = 20;

/**
 * v2.7.2 Victor Fernandez
 * A file whose upload has to be retried goes back to the end of the list, so the workers go on with the
 * other files and only come back to it once every other file has been handed out.
 */
export async function createFiles({ ctx, remoteTree, added }: Props) {
  const pending: PendingFile[] = added.map(({ path }) => ({ path, attempt: 1, retryAt: 0 }));
  let nextIndex = 0;

  async function processNext() {
    while (nextIndex < pending.length) {
      const { path, attempt, retryAt } = pending[nextIndex];
      nextIndex += 1;
      const retry = trackRetry();

      if (retryAt > Date.now()) await sleep(retryAt - Date.now());

      try {
        await scheduleRequest({
          ctx,
          path,
          willRetry: retry.willRetry,
          fn: () => createFile({ ctx, path, remoteTree, attempt, retryLater: retry.retryLater }),
        });
      } catch (error) {
        const fileStats = await stat(path).catch(() => null);

        ctx.logger.sentryError({ msg: 'Error creating file', path, error }, { fileSize: fileStats?.size });
      }

      const next = retry.next();
      if (next) pending.push({ path, attempt: next.attempt, retryAt: Date.now() + next.delayMs });
    }
  }

  const workerCount = getWorkerCount({ concurrency: CREATE_FILES_CONCURRENCY, itemCount: added.length });
  await Promise.all(Array.from({ length: workerCount }, processNext));
}

async function createFile({
  ctx,
  path,
  remoteTree,
  attempt,
  retryLater,
}: {
  ctx: BackupsContext;
  path: AbsolutePath;
  remoteTree: RemoteTree;
  attempt: number;
  retryLater: RetryLater;
}) {
  const parentPath = dirname(path);
  const parent = remoteTree.folders.get(parentPath);

  if (!parent) return;

  await Sync.Actions.createFile({ ctx, path, parentUuid: parent.uuid, attempt, retryLater });
}
