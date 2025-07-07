import VirtualDrive from '@/node-win/virtual-drive';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { logger } from '@/apps/shared/logger/logger';

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
  } catch (error) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Error dehydrating file',
      path,
      error,
    });
  }
}
