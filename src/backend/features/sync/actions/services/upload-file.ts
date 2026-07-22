import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { stat } from 'node:fs/promises';
import { electronStore } from '@/apps/main/config';
import { CommonContext } from '@/apps/sync-engine/config';
import { validateUploadFileSize } from '@/backend/features/user/file-size-limit';
import { isBottleneckStop } from '@/infra/drive-server-wip/in/helpers/error-helpers';
import { environmentFileUpload } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { handleFileUploadSizeExceeded } from '../../../user/file-size-limit/handle-file-upload-size-exceeded';
import { waitUntilReady } from './wait-until-ready';

type Props = {
  ctx: CommonContext;
  path: AbsolutePath;
};

export async function uploadFile({ ctx, path }: Props) {
  const isReady = await waitUntilReady({ path });
  if (!isReady) {
    ctx.logger.error({ msg: 'Wait until ready, timeout', path });
    return;
  }

  const { size, mtime, birthtime } = await stat(path);

  if (size === 0) {
    return { contentsId: undefined, size, mtime, creationTime: birthtime };
  }

  const validation = validateUploadFileSize({ size, maxUploadFileSize: electronStore.get('maxUploadFileSizeInBytes') });
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
    const contentsId = await ctx.uploadBottleneck.schedule(() => environmentFileUpload({ ctx, path, size }));

    if (!contentsId) return;

    return { contentsId, size, mtime, creationTime: birthtime };
  } catch (error) {
    if (isBottleneckStop({ error })) return;

    ctx.logger.sentryError({ msg: 'Error uploading file', path, error }, { fileSize: size });

    throw error;
  }
}
