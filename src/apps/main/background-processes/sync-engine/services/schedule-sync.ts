import { updateRemoteSync } from '@/apps/main/remote-sync/handlers';
import { RemoteSyncManager } from '@/apps/main/remote-sync/RemoteSyncManager';
import { SyncContext } from '@/apps/sync-engine/config';

const TEN_MINUTES = 10 * 60 * 1000;

type Props = { ctx: SyncContext; manager: RemoteSyncManager };

export function scheduleSync({ ctx, manager }: Props) {
  void updateRemoteSync({ manager });

  return setInterval(async () => {
    ctx.logger.debug({ msg: 'Start scheduled sync' });
    await updateRemoteSync({ manager });
  }, TEN_MINUTES);
}
