import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { z } from 'zod';
import { addGeneralIssue, setUploadIssue } from '@/apps/main/background-processes/issues';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { sleep } from '@/apps/main/util';
import { CONTEXT_KINDS, CommonContext } from '@/apps/sync-engine/config';
import { LocalSync } from '@/backend/features';
import { isAbortError } from '@/infra/drive-server-wip/in/helpers/error-helpers';

const RETRYABLE_MESSAGES = new Set([
  'read ECONNRESET',
  'Request failed with status code 409',
  'Request failed with status code 500',
  'Request failed with status code 502',
]);

/**
 * v2.7.0 Victor Fernandez
 * The same connection cut reaches us with different messages (`write ECONNRESET`, `socket hang up`, TLS
 * disconnected...), so these are matched by code. Only codes seen in real upload logs are added.
 */
const RETRYABLE_CODES = new Set(['ECONNRESET', 'UND_ERR_CONNECT_TIMEOUT', 'ENOTFOUND']);

const errorCodeSchema = z.object({ code: z.string() });

function isRetryable({ error }: { error: Error }) {
  if (RETRYABLE_MESSAGES.has(error.message)) return true;

  const parsed = errorCodeSchema.safeParse(error);
  return parsed.success && RETRYABLE_CODES.has(parsed.data.code);
}

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

  if (error instanceof Error && isRetryable({ error })) {
    addGeneralIssue({ error: 'NETWORK_CONNECTIVITY_ERROR', name: path });

    await sleep(sleepMs);
    return retryFn();
  }

  if (ctx.kind === CONTEXT_KINDS.SYNC) {
    setUploadIssue({ path, error: 'UPLOAD_FAILED' });
  }

  if (error instanceof Error && error.message === 'Max space used') {
    addGeneralIssue({ error: 'NOT_ENOUGH_SPACE', name: path });
  }
}
