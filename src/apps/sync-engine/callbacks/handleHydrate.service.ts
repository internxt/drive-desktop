import VirtualDrive from '@/node-win/virtual-drive';
import { logger } from '@/apps/shared/logger/logger';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import Bottleneck from 'bottleneck';
import { basename } from 'path';

const limiter = new Bottleneck({ maxConcurrent: 1 });

export const store = {
  lastHydrated: '',
};

type TProps = {
  drive: VirtualDrive;
  path: RelativePath;
};

export async function handleHydrate({ drive, path }: TProps) {
  try {
    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Hydrating file',
      path,
    });

    const nameWithExtension = basename(path);

    if (store.lastHydrated === nameWithExtension) {
      logger.debug({
        tag: 'SYNC-ENGINE',
        msg: 'Skip hydrating file',
        nameWithExtension,
        path,
      });

      return;
    }

    await limiter.schedule(() => drive.hydrateFile({ itemPath: path }));
  } catch (error) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Error hydrating file',
      path,
      error,
    });
  }
}
