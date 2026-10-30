import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { FilesDiff } from '@/apps/backups/diff/calculate-files-diff';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { sleep } from '@/apps/main/util';
import { Sync } from '@/backend/features/sync';
import { getWorkerCount } from '@/core/utils/concurrency';
import { stat } from '@/infra/file-system/original-fs';
import { scheduleRequest } from '../schedule-request';
import { trackRetry } from './track-retry';

type Props = {
  ctx: BackupsContext;
  modified: FilesDiff['modified'];
};

type PendingFile = {
  path: AbsolutePath;
  uuid: FileUuid;
  attempt: number;
  retryAt: number;
};

const REPLACE_FILES_CONCURRENCY = 20;

/**
 * v2.7.2 Victor Fernandez
 * A file whose upload has to be retried goes back to the end of the list, so the workers go on with the
 * other files and only come back to it once every other file has been handed out.
 */
export async function replaceFiles({ ctx, modified }: Props) {
  const pending: PendingFile[] = modified.map(({ local, remote }) => ({ path: local.path, uuid: remote.uuid, attempt: 1, retryAt: 0 }));
  let nextIndex = 0;

  async function processNext() {
    while (nextIndex < pending.length) {
      const { path, uuid, attempt, retryAt } = pending[nextIndex];
      nextIndex += 1;
      const retry = trackRetry();

      if (retryAt > Date.now()) await sleep(retryAt - Date.now());

      try {
        await scheduleRequest({
          ctx,
          path,
          willRetry: retry.willRetry,
          fn: () => Sync.Actions.replaceFile({ ctx, path, uuid, attempt, retryLater: retry.retryLater }),
        });
      } catch (error) {
        const fileStats = await stat(path).catch(() => null);

        ctx.logger.sentryError({ msg: 'Error replacing file', path, error }, { fileUuid: uuid, fileSize: fileStats?.size });
      }

      const next = retry.next();
      if (next) pending.push({ path, uuid, attempt: next.attempt, retryAt: Date.now() + next.delayMs });
    }
  }

  const workerCount = getWorkerCount({ concurrency: REPLACE_FILES_CONCURRENCY, itemCount: modified.length });
  await Promise.all(Array.from({ length: workerCount }, processNext));
}
