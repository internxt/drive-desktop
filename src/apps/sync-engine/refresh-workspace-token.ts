import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { SyncContext } from './config';

type Props = {
  ctx: SyncContext;
};

export function refreshWorkspaceToken({ ctx }: Props) {
  if (!ctx.workspaceToken) return undefined;

  return setInterval(
    async () => {
      ctx.logger.debug({ msg: 'Refreshing workspace token' });

      const { data: credentials } = await DriveServerWipModule.workspaces.getCredentials({ workspaceId: ctx.workspaceId });

      if (credentials) {
        ctx.workspaceToken = credentials.tokenHeader;
      }
    },
    23 * 60 * 60 * 1000,
  );
}
