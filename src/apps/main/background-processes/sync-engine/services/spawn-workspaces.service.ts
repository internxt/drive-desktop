import { logger } from '@/apps/shared/logger/logger';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { spawnWorkspace } from './spawn-workspace.service';

type TProps = {
  retry?: number;
};

export async function spawnWorkspaces({ retry = 1 }: TProps) {
  logger.debug({ msg: 'Spawn workspaces', retry });

  const { data: workspaces, error } = await driveServerWipModule.workspaces.getWorkspaces();

  if (error) {
    setTimeout(async () => {
      await spawnWorkspaces({ retry: retry + 1 });
    }, 5000);
    return;
  }

  workspaces.availableWorkspaces.forEach(async ({ workspace, workspaceUser }) => {
    // if (workspaceUser.removed) {
    //   logger.debug({ msg: 'Unregistering sync engine for workspace', workspace });
    //   await driveFilesCollection.cleanWorkspace(workspace.id);
    //   await driveFoldersCollection.cleanWorkspace(workspace.id);
    //   ipcMain.emit('UNREGISTER_SYNC_ENGINE_PROCESS', `{${workspace.id}}`);
    //   return;
    // }

    await spawnWorkspace({
      workspace: {
        id: workspace.id,
        mnemonic: workspaceUser.key,
        rootFolderId: workspaceUser.rootFolderId,
      },
    });
  });
}
