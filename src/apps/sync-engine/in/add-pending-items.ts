import { measurePerfomance } from '@/core/utils/measure-performance';
import { ProcessSyncContext } from '../config';
import { Drive } from '@/backend/features/drive';

type Props = {
  ctx: ProcessSyncContext;
};

export async function addPendingItems({ ctx }: Props) {
  ctx.logger.debug({ msg: 'Add pending items' });

  const time = await measurePerfomance(async () => {
    await Drive.Actions.createPendingItems({
      ctx,
      parentPath: ctx.rootPath,
      parentUuid: ctx.rootUuid,
      isFirstExecution: true,
    });
  });

  ctx.logger.debug({ msg: 'Finish add pending items in seconds', time });
}
