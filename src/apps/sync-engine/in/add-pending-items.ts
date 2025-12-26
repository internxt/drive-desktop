import { ProcessSyncContext } from '../config';
import { Drive } from '@/backend/features/drive';

type Props = {
  ctx: ProcessSyncContext;
};

export async function addPendingItems({ ctx }: Props) {
  const startTime = performance.now();

  ctx.logger.debug({ msg: 'Add pending items' });

  await Drive.Actions.createPendingItems({
    ctx,
    parentPath: ctx.rootPath,
    parentUuid: ctx.rootUuid,
    isFirstExecution: true,
  });

  const endTime = performance.now();

  ctx.logger.debug({ msg: 'Finish pending items in seconds', time: (endTime - startTime) / 1000 });
}
