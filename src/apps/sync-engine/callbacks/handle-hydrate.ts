import Bottleneck from 'bottleneck';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Addon } from '@/node-win/addon-wrapper';
import { ProcessSyncContext } from '../config';

const limiter = new Bottleneck({ maxConcurrent: 1 });

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
};

export async function handleHydrate({ ctx, path }: TProps) {
  try {
    ctx.logger.debug({ msg: 'Hydrating file', path });

    await Addon.hydrateFile({ path });
    await Addon.updateSyncStatus({ path });

    ctx.logger.debug({ msg: 'File hydrated', path });
  } catch (error) {
    ctx.logger.error({ msg: 'Error hydrating file', path, error });
  }
}

export async function throttleHydrate(props: TProps) {
  return await limiter.schedule(() => handleHydrate(props));
}
