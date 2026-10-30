import { AbsolutePath, FileSizeLimitModule } from '@internxt/drive-desktop-core/build/backend';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { CONTEXT_KINDS, UploadContext } from '@/apps/sync-engine/config';
import { getFileSizeLimitAdapter } from '@/backend/features/user/file-size-limit';
import { isBottleneckStop } from '@/infra/drive-server-wip/in/helpers/error-helpers';
import { stat } from '@/infra/file-system/original-fs';
import { environmentFileUpload } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { handleFileUploadSizeExceeded } from '../../../user/file-size-limit/handle-file-upload-size-exceeded';
import { UPLOAD_INITIAL_SLEEP_MS, UPLOAD_MAX_SLEEP_MS, UPLOAD_PRIORITY, UPLOAD_RETRY_PRIORITY } from './constants';
import { waitUntilReady } from './wait-until-ready';

export type RetryLater = (props: { attempt: number; delayMs: number }) => void;

type Props = {
  ctx: UploadContext;
  path: AbsolutePath;
  attempt?: number;
  retryLater: RetryLater;
};

export async function uploadFile({ ctx, path, attempt = 1, retryLater }: Props) {
  const { error: notReadyError } = await waitUntilReady({ path });
  if (notReadyError) {
    ctx.logger.error({ msg: 'Wait until ready, timeout', path, reason: notReadyError.code });
    if (ctx.kind === CONTEXT_KINDS.BACKUPS && notReadyError.code !== 'NON_EXISTS') {
      ctx.addIssue({ error: 'FILE_NOT_READY', name: path });
    }
    return;
  }

  const { size, mtime, birthtime } = await stat(path);

  if (size === 0) {
    return { contentsId: undefined, size, mtime, creationTime: birthtime };
  }

  const validation = await FileSizeLimitModule.checkUploadFileSize({ size, ...getFileSizeLimitAdapter({ ctx }) });
  if (!validation.allowed) {
    handleFileUploadSizeExceeded({ path, size, validation });
    ctx.logger.warn({
      msg: 'File size exceeds upload limit',
      path,
      size,
      maxFileSize: validation.maxFileSize,
      reason: validation.reason,
      showUpgradeCta: validation.showUpgradeCta,
    });
    return;
  }

  try {
    const contentsId = await uploadContents({ ctx, path, size, attempt, retryLater });

    if (!contentsId) return;

    return { contentsId, size, mtime, creationTime: birthtime };
  } catch (error) {
    if (isBottleneckStop({ error })) return;

    ctx.logger.sentryError({ msg: 'Error uploading file', path, error }, { fileSize: size });

    throw error;
  }
}

function getRetryDelayMs({ attempt }: { attempt: number }) {
  return Math.min(UPLOAD_INITIAL_SLEEP_MS * 2 ** (attempt - 1), UPLOAD_MAX_SLEEP_MS);
}

/**
 * v2.7.2 Victor Fernandez
 * Retries are unlimited, so a few big files that keep failing used to keep the 4 upload slots, shared by
 * sync and backups, and nothing else uploaded. Now an attempt takes a slot only while it runs, and a
 * retry queues behind the files that have not failed yet (Bottleneck runs the lower priority first).
 * The caller retries later through `retryLater` instead of waiting here, because both the walk of pending
 * items and the backups wait for each file and would get stuck on the failing ones.
 */
async function uploadContents({
  ctx,
  path,
  size,
  attempt,
  retryLater,
}: {
  ctx: UploadContext;
  path: AbsolutePath;
  size: number;
  attempt: number;
  retryLater: RetryLater;
}): Promise<ContentsId | undefined> {
  const priority = attempt === 1 ? UPLOAD_PRIORITY : UPLOAD_RETRY_PRIORITY;
  const { data: contentsId, error } = await ctx.uploadBottleneck.schedule({ priority }, () =>
    environmentFileUpload({ ctx, path, size, attempt }),
  );

  if (error?.code !== 'RETRYABLE') return contentsId;

  const delayMs = getRetryDelayMs({ attempt });
  ctx.logger.debug({ msg: 'Upload failed, retry later', path, attempt: attempt + 1, delayMs });
  retryLater({ attempt: attempt + 1, delayMs });
}
