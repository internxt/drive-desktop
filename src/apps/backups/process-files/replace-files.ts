import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { FilesDiff } from '@/apps/backups/diff/calculate-files-diff';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { sleep } from '@/apps/main/util';
import { Sync } from '@/backend/features/sync';
import { stat } from '@/infra/file-system/original-fs';
import { scheduleRequest } from '../schedule-request';
import { trackRetry } from './track-retry';

type Props = {
  ctx: BackupsContext;
  modified: FilesDiff['modified'];
};

export async function replaceFiles({ ctx, modified }: Props) {
  await Promise.all(modified.map(({ local, remote }) => replaceFile({ ctx, path: local.path, uuid: remote.uuid, attempt: 1 })));
}

/**
 * v2.7.2 Victor Fernandez
 * Every modified file is scheduled at once, so a retry scheduled again after its delay queues behind all of them.
 */
async function replaceFile({ ctx, path, uuid, attempt }: { ctx: BackupsContext; path: AbsolutePath; uuid: FileUuid; attempt: number }) {
  const retry = trackRetry();

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
    return;
  }

  const next = retry.next();
  if (!next) return;

  await sleep(next.delayMs);
  await replaceFile({ ctx, path, uuid, attempt: next.attempt });
}
