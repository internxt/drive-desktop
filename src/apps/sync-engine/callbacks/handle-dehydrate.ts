import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Addon } from '@/node-win/addon-wrapper';
import { ProcessSyncContext } from '../config';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
};

export async function handleDehydrate({ ctx, path }: TProps) {
  try {
    ctx.logger.debug({ msg: 'Dehydrating file', path });

    await Addon.dehydrateFile({ path });
  } catch (error) {
    ctx.logger.error({ msg: 'Error dehydrating file', path, error });
  }
}
