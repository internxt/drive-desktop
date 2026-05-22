import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Addon } from '@/node-win/addon-wrapper';
import { SyncContext } from '../config';

type TProps = {
  ctx: SyncContext;
  path: AbsolutePath;
};

export async function handleDehydrate({ ctx, path }: TProps) {
  try {
    ctx.logger.debug({ msg: 'Dehydrating file', path });

    await Addon.dehydrateFile({ path });
  } catch (error) {
    ctx.logger.sentryError({ msg: 'Error dehydrating file', path, error });
  }
}
