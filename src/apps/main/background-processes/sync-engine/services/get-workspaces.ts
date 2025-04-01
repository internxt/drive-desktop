import { sleep } from '@/apps/main/util';
import { logger } from '@/apps/shared/logger/logger';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';

type TProps = {
  retry?: number;
};

export async function getWorkspaces({ retry = 1 }: TProps) {
  logger.debug({ msg: 'Get workspaces', retry });

  const { data: workspaces, error } = await driveServerWipModule.workspaces.getWorkspaces();

  if (error) {
    await sleep(5000);
    return await getWorkspaces({ retry: retry + 1 });
  }

  return workspaces.availableWorkspaces.map(({ workspace, workspaceUser }) => ({
    id: workspace.id,
    /**
     * v2.5.1 Daniel Jiménez
     * The registry of windows automatically parses the providerId to camel case, so, to avoid any missmatch,
     * we are going to parse it too, and then both are the same string.
     */
    providerId: `{${workspaceUser.id.toUpperCase()}}`,
    mnemonic: workspaceUser.key,
    rootFolderId: workspaceUser.rootFolderId,
  }));
}
