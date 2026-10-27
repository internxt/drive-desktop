import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { FilesDiff } from '@/apps/backups/diff/calculate-files-diff';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { sleep } from '@/apps/main/util';
import { Sync } from '@/backend/features/sync';
import { stat } from '@/infra/file-system/original-fs';
import { scheduleRequest } from '../schedule-request';

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
  let retry: { attempt: number; delayMs: number } | undefined;

  try {
    await scheduleRequest({
      ctx,
      path,
      willRetry: () => retry !== undefined,
      fn: () => Sync.Actions.replaceFile({ ctx, path, uuid, attempt, retryLater: (next) => (retry = next) }),
    });
  } catch (error) {
    const fileStats = await stat(path).catch(() => null);

    ctx.logger.sentryError({ msg: 'Error replacing file', path, error }, { fileUuid: uuid, fileSize: fileStats?.size });
    return;
  }

  if (!retry) return;

  await sleep(retry.delayMs);
  await replaceFile({ ctx, path, uuid, attempt: retry.attempt });
}
