import { VirtualDrive } from '@/node-win/virtual-drive';
import { logger } from '@/apps/shared/logger/logger';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type TProps = {
  drive: VirtualDrive;
  path: AbsolutePath;
};

export function handleDehydrate({ drive, path }: TProps) {
  try {
    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Dehydrating file',
      path,
    });

    drive.dehydrateFile({ path });
  } catch (error) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Error dehydrating file',
      path,
      error,
    });
  }
}
