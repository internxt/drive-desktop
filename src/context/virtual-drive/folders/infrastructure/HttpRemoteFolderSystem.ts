import { Folder, FolderAttributes } from '../domain/Folder';
import { Service } from 'diod';
import { FolderStatuses } from '../domain/FolderStatus';
import { PersistFolderDto, PersistFolderInWorkspaceDto, PersistFolderResponseDto } from './dtos/client.dto';
import { client } from '../../../../apps/shared/HttpClient/client';
import { logger } from '@/apps/shared/logger/logger';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
@Service()
export class HttpRemoteFolderSystem {
  constructor(private readonly workspaceId?: string) {}

  async persist(offline: { basename: string; parentUuid: string; path: string }): Promise<FolderAttributes> {
    if (!offline.basename) {
      throw new Error('Bad folder name');
    }

    const body = {
      plainName: offline.basename,
      name: offline.basename,
      parentFolderUuid: offline.parentUuid,
    };
    try {
      const result = this.workspaceId ? await this.createFolderInWorkspace(body, this.workspaceId) : await this.createFolder(body);

      return {
        id: result.id,
        uuid: result.uuid,
        parentId: result.parentId,
        parentUuid: result.parentUuid,
        path: offline.path,
        updatedAt: result.updatedAt,
        createdAt: result.createdAt,
        status: FolderStatuses.EXISTS,
      };
    } catch (error: unknown) {
      logger.error({
        msg: 'Error creating folder',
        exc: error,
      });

      const existing = await this.existFolder(offline);
      return existing.status !== FolderStatuses.EXISTS ? Promise.reject(error) : existing;
    }
  }

  private async createFolder(body: PersistFolderDto): Promise<PersistFolderResponseDto> {
    try {
      const response = await client.POST('/folders', {
        body,
      });

      if (!response.data) {
        logger.error({
          msg: 'Error creating file entry',
          error: response.error,
        });

        throw new Error('Error creating file entry');
      }

      return response.data;
    } catch (error) {
      throw new Error('Failed to create file and no existing file found');
    }
  }

  private async createFolderInWorkspace(body: PersistFolderInWorkspaceDto, workspaceId: string): Promise<PersistFolderResponseDto> {
    try {
      const response = await client.POST('/workspaces/{workspaceId}/folders', {
        params: {
          path: {
            workspaceId,
          },
        },
        body,
      });

      if (response.error) {
        logger.error({
          msg: 'Error creating file entry',
          error: response,
        });
        throw new Error('Error creating file entry');
      }

      return response.data;
    } catch (error) {
      logger.error({
        msg: 'Error creating file entry',
        exc: error,
      });
      throw new Error('Failed to create file and no existing file found');
    }
  }

  private async existFolder(offline: { parentUuid: string; basename: string; path: string }): Promise<FolderAttributes> {
    const { data, error } = await driveServerWip.folders.existsFolder({ parentUuid: offline.parentUuid, basename: offline.basename });
    if (!data) throw error;
    return {
      ...data.existentFolders[0],
      path: offline.path,
    };
  }

  async trash(folder: Folder): Promise<void> {
    const { error } = await driveServerWip.storage.deleteFolderByUuid({ uuid: folder.uuid });
    if (error) throw error;
  }

  async getFolderMetadata(folder: Folder) {
    const { data, error } = await driveServerWip.folders.getMetadataWithUuid({ uuid: folder.uuid });
    if (!data) throw error;
    return data;
  }

  async rename(folder: Folder): Promise<void> {
    const metadata = await this.getFolderMetadata(folder);
    if (metadata.plainName === folder.name) return;

    const { error } = await driveServerWip.folders.renameFolder({ uuid: folder.uuid, plainName: folder.name });
    if (error) throw error;
  }

  async move(folder: Folder): Promise<void> {
    if (!folder.parentUuid) {
      throw logger.error({
        msg: 'Error moving folder, folder does not have a parent',
      });
    }

    const { error } = await driveServerWip.folders.moveFolder({ uuid: folder.uuid, parentUuid: folder.parentUuid });
    if (error) throw error;
  }
}
