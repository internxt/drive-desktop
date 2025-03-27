import { logger } from '../../../../apps/shared/logger/logger';
import { DriveFoldersCollection } from '../../database/collections/DriveFolderCollection';
import { DriveWorkspaceCollection } from '../../database/collections/DriveWorkspaceCollection';
import { DriveWorkspace } from '../../database/entities/DriveWorkspace';
import { FetchWorkspacesService } from './fetch-workspaces.service';

export class SyncRemoteWorkspaceService {
  constructor(private readonly workspaceCollection: DriveWorkspaceCollection, private readonly folderCollection: DriveFoldersCollection) {}

  private async createOrUpdate(workspaces: DriveWorkspace[]): Promise<DriveWorkspace[]> {
    try {
      const existingWorkspaces = await this.workspaceCollection.getAll();
      const incomingWorkspaceIds = new Set(workspaces.map((ws) => ws.id));

      const workspacesToDelete = existingWorkspaces.result.filter((ws) => !incomingWorkspaceIds.has(ws.id));
      await Promise.all(
        workspacesToDelete.map(async (ws) => {
          return await this.workspaceCollection.update(ws.id, {
            removed: true,
          });
        }),
      );

      const updateOrCreateWorkspace = async (workspace: DriveWorkspace) => {
        const existingWorkspace = await this.workspaceCollection.get(workspace.id);
        let response;
        if (existingWorkspace.result) {
          response = await this.workspaceCollection.update(workspace.id, {
            ...workspace,
            removed: false,
          });
        } else {
          response = await this.workspaceCollection.create({
            ...workspace,
            removed: false,
          });
        }
        return response.result;
      };

      const result = await Promise.all(workspaces.map(updateOrCreateWorkspace));

      return result.filter(Boolean) as DriveWorkspace[];
    } catch (error) {
      logger.error({ msg: 'Error creating, updating, or deleting workspace', error });
      throw error;
    }
  }

  async run(): Promise<DriveWorkspace[]> {
    try {
      const result = await FetchWorkspacesService.run();
      const workspaces: DriveWorkspace[] = await Promise.all(
        result.availableWorkspaces.map(async ({ workspace, workspaceUser }) => {
          return {
            id: workspace.id,
            ownerId: workspace.ownerId,
            name: workspace.name,
            defaultTeamId: workspace.defaultTeamId,
            workspaceUserId: workspace.workspaceUserId,
            setupCompleted: workspace.setupCompleted,
            rootFolderId: workspace.rootFolderId ?? '',
            mnemonic: workspaceUser.key,
            createdAt: workspace.createdAt,
            updatedAt: workspace.updatedAt,
            removed: false,
          };
        }),
      );
      return await this.createOrUpdate(workspaces);
    } catch (error) {
      logger.error({ msg: 'Error syncing workspace', error });
      throw error;
    }
  }

  async getWorkspaceById(workspaceId: string): Promise<{
    result: DriveWorkspace | null;
    success: boolean;
  }> {
    return await this.workspaceCollection.get(workspaceId);
  }

  async getWorkspaces(): Promise<DriveWorkspace[]> {
    const workspaces = await this.workspaceCollection.getAll();
    return workspaces.result;
  }

  async getRootFolderUuid(workspaceId: string): Promise<string> {
    const workspace = await this.getWorkspaceById(workspaceId);
    const rootFolder = await this.folderCollection.searchPartialBy({ parentUuid: workspace.result?.rootFolderId, workspaceId });
    logger.debug({ msg: 'Root folder', rootFolder });
    if (!rootFolder.result || rootFolder.result.length === 0) {
      throw new Error('Root folder not found');
    }
    return rootFolder.result[0]?.uuid ?? '';
  }
}
