import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { removeSyncIssue } from '@/apps/main/background-processes/issues';
import { isBottleneckStop } from '@/infra/drive-server-wip/in/helpers/error-helpers';
import { Addon } from '@/node-win/addon-wrapper';
import { SyncContext } from '../config';

type Props = {
  ctx: SyncContext;
  path: AbsolutePath;
};

export async function handleHydrate({ ctx, path }: Props) {
  try {
    ctx.logger.debug({ msg: 'Hydrating file', path });

    await Addon.hydrateFile({ path });
    await Addon.updateSyncStatus({ path });

    ctx.logger.debug({ msg: 'File hydrated', path });
    removeSyncIssue({ error: 'PINNED_FILE_NOT_DOWNLOADED', name: path });
  } catch (error) {
    ctx.logger.sentryError({ msg: 'Error hydrating file', path, error });
  }
}

export async function throttleHydrate({ ctx, path }: Props) {
  try {
    return await ctx.downloadBottleneck.schedule(() => handleHydrate({ ctx, path }));
  } catch (error) {
    if (isBottleneckStop({ error })) return;

    throw error;
  }
}
