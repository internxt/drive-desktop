import { AbsolutePath, SyncModule } from '@internxt/drive-desktop-core/build/backend';
import { stat } from 'node:fs/promises';
import { addSyncIssue } from '@/apps/main/background-processes/issues';
import { CommonContext } from '@/apps/sync-engine/config';
import { isBottleneckStop } from '@/infra/drive-server-wip/in/helpers/error-helpers';
import { environmentFileUpload } from '@/infra/inxt-js/file-uploader/environment-file-uploader';

type Props = {
  ctx: CommonContext;
  path: AbsolutePath;
};

export async function uploadFile({ ctx, path }: Props) {
  const { size, mtime } = await stat(path);

  if (size === 0) {
    return { contentsId: undefined, size, mtime };
  }

  if (size > SyncModule.MAX_FILE_SIZE) {
    ctx.logger.warn({ msg: 'File size is too big', path, size });
    addSyncIssue({ error: 'FILE_SIZE_TOO_BIG', name: path });
    return;
  }

  try {
    const contentsId = await ctx.uploadBottleneck.schedule(() => environmentFileUpload({ ctx, path, size }));

    if (!contentsId) return;

    return { contentsId, size, mtime };
  } catch (error) {
    if (isBottleneckStop({ error })) return;

    throw error;
  }
}
