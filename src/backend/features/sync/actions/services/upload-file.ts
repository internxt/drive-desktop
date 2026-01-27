import { addSyncIssue } from '@/apps/main/background-processes/issues';
import { CommonContext } from '@/apps/sync-engine/config';
import { isBottleneckStop } from '@/infra/drive-server-wip/in/helpers/error-helpers';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { AbsolutePath, SyncModule } from '@internxt/drive-desktop-core/build/backend';
import { waitUntilReady } from './wait-until-ready';
import { stat } from 'node:fs/promises';

type Props = {
  ctx: CommonContext;
  path: AbsolutePath;
  /**
   * v2.6.5 Daniel Jiménez
   * Keep the prop so we don't have to remove everywhere since the `waitUntilReady`
   * is just a patch for now.
   */
  size: number;
};

export async function uploadFile({ ctx, path }: Props) {
  /**
   * v2.6.5 Daniel Jiménez
   * This is a bit flaky because it relies on a timeout, probably we should explore
   * better alternatives.
   */
  const isReady = await waitUntilReady({ path });
  if (!isReady) {
    ctx.logger.error({ msg: 'Wait until ready, timeout', path });
    return;
  }

  const { size } = await stat(path);

  if (size === 0) {
    return { contentsId: undefined, size };
  }

  if (size > SyncModule.MAX_FILE_SIZE) {
    ctx.logger.warn({ msg: 'File size is too big', path, size });
    addSyncIssue({ error: 'FILE_SIZE_TOO_BIG', name: path });
    return;
  }

  try {
    const contentsId = await ctx.uploadBottleneck.schedule(() => EnvironmentFileUploader.run({ ctx, path, size }));

    if (!contentsId) return;

    return { contentsId, size };
  } catch (error) {
    if (isBottleneckStop({ error })) return;

    throw error;
  }
}
