import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { addGeneralIssue } from '@/apps/main/background-processes/issues';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { sleep } from '@/apps/main/util';
import { CommonContext } from '@/apps/sync-engine/config';
import { LocalSync } from '@/backend/features';
import { isAbortError } from '@/infra/drive-server-wip/in/helpers/error-helpers';

type TProps = {
  ctx: CommonContext;
  path: AbsolutePath;
  size: number;
  error: unknown;
  sleepMs: number;
  retryFn: () => Promise<ContentsId | undefined>;
};

export async function processError({ ctx, path, error, sleepMs, size, retryFn }: TProps) {
  if (isAbortError({ error })) return;

  ctx.logger.sentryError({ msg: 'Failed to upload file to the bucket', path, error }, { size });
  LocalSync.SyncState.addItem({ action: 'UPLOAD_ERROR', path });

  if (!(error instanceof Error)) return;

  if (
    error.message === 'read ECONNRESET' ||
    error.message === 'Request failed with status code 409' ||
    error.message === 'Request failed with status code 500'
  ) {
    addGeneralIssue({ error: 'NETWORK_CONNECTIVITY_ERROR', name: path });
    await sleep(sleepMs);
    return retryFn();
  }

  if (error.message === 'Max space used') {
    addGeneralIssue({ error: 'NOT_ENOUGH_SPACE', name: path });
  }
}
