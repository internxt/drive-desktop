import { ProcessSyncContext } from '../config';
import { Drive } from '@/backend/features/drive';

type Props = {
  ctx: ProcessSyncContext;
};

export async function addPendingItems({ ctx }: Props) {
  try {
    const startTime = performance.now();

    await Drive.Actions.createPendingItems({
      ctx,
      parentPath: ctx.rootPath,
      parentUuid: ctx.rootUuid,
      isFirstExecution: true,
    });

    const endTime = performance.now();

    ctx.logger.debug({ msg: 'Finish pending items in seconds', time: (endTime - startTime) / 1000 });
  } catch (error) {
    ctx.logger.error({ msg: 'Error adding pending items', error });
  }
}
