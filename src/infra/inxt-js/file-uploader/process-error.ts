import { addGeneralIssue } from '@/apps/main/background-processes/issues';
import { LocalSync } from '@/backend/features';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { CommonContext } from '@/apps/sync-engine/config';
import { sleep } from '@/apps/main/util';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { isAbortError } from '@/infra/drive-server-wip/in/helpers/error-helpers';

type TProps = {
  ctx: CommonContext;
  path: AbsolutePath;
  error: unknown;
  sleepMs: number;
  retryFn: () => Promise<ContentsId | undefined>;
};

export async function processError({ ctx, path, error, sleepMs, retryFn }: TProps) {
  if (isAbortError({ error })) return;

  ctx.logger.error({ msg: 'Failed to upload file to the bucket', path, error });
  LocalSync.SyncState.addItem({ action: 'UPLOAD_ERROR', path });

  if (!(error instanceof Error)) return;

  if (error.message === 'Server unavailable' || error.message === 'Incomplete HTTP response') {
    addGeneralIssue({ error: 'NETWORK_CONNECTIVITY_ERROR', name: path });
    await sleep(sleepMs);
    return retryFn();
  }

  if (error.message === 'Max space used') {
    addGeneralIssue({ error: 'NOT_ENOUGH_SPACE', name: path });
  }
}
