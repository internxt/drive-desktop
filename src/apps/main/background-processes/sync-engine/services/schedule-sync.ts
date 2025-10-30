import { logger } from '@/apps/shared/logger/logger';
import { updateRemoteSync } from '@/apps/main/remote-sync/handlers';

const TEN_MINUTES = 10 * 60 * 1000;

type Props = { workspaceId: string };

export function scheduleSync({ workspaceId }: Props) {
  void updateRemoteSync({ workspaceId });

  return setInterval(async () => {
    logger.debug({ tag: 'SYNC-ENGINE', msg: 'Start scheduled sync' });
    await updateRemoteSync({ workspaceId });
  }, TEN_MINUTES);
}
