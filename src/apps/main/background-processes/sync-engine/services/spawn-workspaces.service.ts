import { loggerService } from '@/apps/shared/logger/logger';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { SpawnWorkspaceService } from './spawn-workspace.service';

type TProps = {
  retry?: number;
};

export class SpawnWorkspacesService {
  constructor(
    private readonly driveServerWip = driveServerWipModule,
    private readonly spawnWorkspace = new SpawnWorkspaceService(),
    private readonly logger = loggerService,
  ) {}

  async run({ retry = 1 }: TProps) {
    this.logger.debug({ msg: 'Spawn workspaces', retry });

    const { data: workspaces, error } = await this.driveServerWip.workspaces.getWorkspaces();

    if (error) {
      setTimeout(async () => {
        await this.run({ retry: retry + 1 });
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

      await this.spawnWorkspace.run({
        workspace: {
          id: workspace.id,
          mnemonic: workspaceUser.key,
          rootFolderId: workspaceUser.rootFolderId,
        },
      });
    });
  }
}
