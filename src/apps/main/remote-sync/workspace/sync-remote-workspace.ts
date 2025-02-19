import { logger } from '../../../../apps/shared/logger/logger';
import { DriveWorkspaceCollection } from '../../database/collections/DriveWorkspaceCollection';
import { DriveWorkspace } from '../../database/entities/DriveWorkspace';
import { FetchWorkspacesService } from './fetch-workspaces.service';

export class SyncRemoteWorkspaceService {
  constructor(private readonly workspaceCollection: DriveWorkspaceCollection) {}

  private async createOrUpdate(workspaces: DriveWorkspace[]): Promise<DriveWorkspace[]> {
    try {
      const updateOrCreateWorkspace = async (workspace: DriveWorkspace) => {
        const existingWorkspace = await this.workspaceCollection.get(workspace.id);
        let response;
        if (existingWorkspace.result) {
          response = await this.workspaceCollection.update(workspace.id, workspace);
        } else {
          response = await this.workspaceCollection.create(workspace);
        }
        return response.result;
      };

      const result = await Promise.all(workspaces.map(updateOrCreateWorkspace));

      return result.filter(Boolean) as DriveWorkspace[];
    } catch (error) {
      logger.error('Error creating or updating workspace', error);
      throw error;
    }
  }

  async run(): Promise<DriveWorkspace[]> {
    try {
      const result = await FetchWorkspacesService.run();
      const workspaces: DriveWorkspace[] = result.availableWorkspaces.map(({ workspace }) => {
        return {
          id: workspace.id,
          ownerId: workspace.ownerId,
          name: workspace.name,
          description: workspace.description,
          defaultTeamId: workspace.defaultTeamId,
          workspaceUserId: workspace.workspaceUserId,
          setupCompleted: workspace.setupCompleted,
          rootFolderId: workspace.rootFolderId,
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt,
        };
      });
      return await this.createOrUpdate(workspaces);
    } catch (error) {
      logger.error('Error syncing workspace', error);
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
}
