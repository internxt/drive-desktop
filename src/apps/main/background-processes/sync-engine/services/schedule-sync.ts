import { updateRemoteSync } from '@/apps/main/remote-sync/handlers';
import { SyncContext } from '@/apps/sync-engine/config';

const TEN_MINUTES = 10 * 60 * 1000;

type Props = { ctx: SyncContext };

export function scheduleSync({ ctx }: Props) {
  void updateRemoteSync({ ctx });

  return setInterval(async () => {
    ctx.logger.debug({ msg: 'Start scheduled sync' });
    await updateRemoteSync({ ctx });
  }, TEN_MINUTES);
}
