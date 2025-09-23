import { logger } from '@/apps/shared/logger/logger';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import Bottleneck from 'bottleneck';
import { ProcessSyncContext } from '../config';

const limiter = new Bottleneck({ maxConcurrent: 1 });

type TProps = {
  ctx: ProcessSyncContext;
  path: RelativePath;
};

export async function handleHydrate({ ctx, path }: TProps) {
  try {
    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Hydrating file',
      path,
    });

    await ctx.virtualDrive.hydrateFile({ itemPath: path });

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'File hydrated',
      path,
    });
  } catch (error) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Error hydrating file',
      path,
      error,
    });
  }
}

export async function throttleHydrate(props: TProps) {
  return await limiter.schedule(() => handleHydrate(props));
}
