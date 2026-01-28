import { addSyncIssue } from '@/apps/main/background-processes/issues';
import { CommonContext } from '@/apps/sync-engine/config';
import { isBottleneckStop } from '@/infra/drive-server-wip/in/helpers/error-helpers';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { AbsolutePath, SyncModule } from '@internxt/drive-desktop-core/build/backend';

type Props = {
  ctx: CommonContext;
  path: AbsolutePath;
  size: number;
};

export async function uploadFile({ ctx, path, size }: Props) {
  if (size === 0) {
    return { contentsId: undefined };
  }

  if (size > SyncModule.MAX_FILE_SIZE) {
    ctx.logger.warn({ msg: 'File size is too big', path, size });
    addSyncIssue({ error: 'FILE_SIZE_TOO_BIG', name: path });
    return;
  }

  try {
    const contentsId = await ctx.uploadBottleneck.schedule(() => EnvironmentFileUploader.run({ ctx, path, size }));

    if (!contentsId) return;

    return { contentsId };
  } catch (error) {
    if (isBottleneckStop({ error })) return;

    throw error;
  }
}
