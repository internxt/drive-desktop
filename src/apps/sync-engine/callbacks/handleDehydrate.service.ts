import VirtualDrive from '@/node-win/virtual-drive';
import { logger } from '@/apps/shared/logger/logger';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

type TProps = {
  drive: VirtualDrive;
  path: RelativePath;
};

export function handleDehydrate({ drive, path }: TProps) {
  try {
    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Dehydrating file',
      path,
    });

    drive.dehydrateFile({ itemPath: path });
  } catch (exc) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Error dehydrating file',
      path,
      exc,
    });
  }
}
