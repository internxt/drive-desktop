import { logger } from '../../../../apps/shared/logger/logger';
import { DriveFoldersCollection } from '../../database/collections/DriveFolderCollection';
import { DriveWorkspaceCollection } from '../../database/collections/DriveWorkspaceCollection';
import { DriveWorkspace } from '../../database/entities/DriveWorkspace';
import { FetchWorkspacesService } from './fetch-workspaces.service';

export class SyncRemoteWorkspaceService {
  constructor(
    private readonly workspaceCollection: DriveWorkspaceCollection,
    private readonly folderCollection: DriveFoldersCollection,
  ) {}

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
      logger.error({ msg: 'Error creating or updating workspace', error });
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

export const driveFoldersCollection = new DriveFoldersCollection();
export const driveWorkspaceCollection = new DriveWorkspaceCollection();
export const syncWorkspaceService = new SyncRemoteWorkspaceService(driveWorkspaceCollection, driveFoldersCollection);
