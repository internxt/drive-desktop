import { Folder, FolderAttributes } from '../domain/Folder';
import { Service } from 'diod';
import { FolderStatuses } from '../domain/FolderStatus';
import { OfflineFolder } from '../domain/OfflineFolder';
import { PersistFolderDto, PersistFolderInWorkspaceDto, PersistFolderResponseDto, UpdateFolderMetaDto } from './dtos/client.dto';
import { client } from '../../../../apps/shared/HttpClient/client';
import { logger } from '@/apps/shared/logger/logger';
@Service()
export class HttpRemoteFolderSystem {
  constructor(private readonly workspaceId?: string) {}

  async persist(offline: OfflineFolder): Promise<FolderAttributes> {
    if (!offline.name || !offline.basename) {
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
        path: offline.path.value,
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

  private async existFolder(offline: OfflineFolder): Promise<FolderAttributes> {
    try {
      const response = await client.POST('/folders/content/{uuid}/folders/existence', {
        params: {
          path: {
            uuid: offline.uuid,
          },
        },
        body: {
          plainNames: [offline.basename],
        },
      });
      logger.debug({
        msg: 'Checking folder existence',
        response,
      });

      if (!response.data) {
        logger.error({
          msg: 'Error getting folder by name',
          error: response.error,
        });
        throw new Error('Error getting file by name');
      }
      const data = response.data.existentFolders[0];

      if (!data) {
        throw new Error('Folder creation failed, no data returned');
      }

      return {
        id: data.id,
        uuid: data.uuid,
        parentId: data.parentId,
        parentUuid: data.parentUuid,
        updatedAt: data.updatedAt,
        createdAt: data.createdAt,
        path: offline.path.value,
        status: data.status,
      };
    } catch (error) {
      logger.error({
        msg: 'Error getting folder by name',
        exc: error,
      });
      throw error;
    }
  }

  async trash(folder: Folder): Promise<void> {
    try {
      const response = await client.POST('/storage/trash/add', {
        body: {
          items: [{ type: 'folder', uuid: folder.uuid, id: null }],
        },
      });
      if (response.error) {
        logger.error({
          msg: 'Error trashing file',
          error: response,
        });
        throw new Error('Error trashing file');
      }
    } catch (error) {
      logger.error({
        msg: 'Error trashing file',
        exc: error,
      });
      throw error;
    }
  }

  async getFolderMetadata(folder: Folder): Promise<PersistFolderResponseDto> {
    try {
      const res = await client.GET('/folders/{uuid}/meta', {
        params: {
          path: {
            uuid: folder.uuid,
          },
        },
      });

      if (res.error) {
        logger.error({
          msg: 'Error getting folder metadata',
          error: res,
        });
        throw new Error('Error getting folder metadata');
      }

      const serverFolder = res.data;
      return serverFolder;
    } catch (error) {
      logger.error({
        msg: 'Error getting folder metadata',
        exc: error,
      });
      throw error;
    }
  }

  async rename(folder: Folder): Promise<void> {
    try {
      const metadata = await this.getFolderMetadata(folder);
      if (metadata.plainName === folder.name) return;

      const body: UpdateFolderMetaDto = {
        plainName: folder.name,
      };

      const res = await client.PUT('/folders/{uuid}/meta', {
        params: {
          path: {
            uuid: folder.uuid,
          },
        },
        body,
      });

      if (res.error) {
        logger.error({
          msg: 'Error renaming folder',
          error: res,
        });
        throw new Error('Error renaming folder');
      }
    } catch (error) {
      logger.error({
        msg: 'Error renaming folder',
        exc: error,
      });
      throw error;
    }
  }

  async move(folder: Folder): Promise<void> {
    try {
      if (!folder.parentUuid) {
        logger.error({
          msg: 'Error moving folder',
          error: 'Folder does not have a parent',
        });
        throw new Error('Error moving folder');
      }

      const res = await client.PATCH('/folders/{uuid}', {
        params: {
          path: {
            uuid: folder.uuid,
          },
        },
        body: {
          destinationFolder: folder.parentUuid,
        },
      });
      if (res.error) {
        logger.error({
          msg: 'Error moving folder',
          error: res,
        });
        throw new Error('Error moving folder');
      }
    } catch (error) {
      logger.error({
        msg: 'Error moving folder',
        exc: error,
      });
      throw error;
    }
  }
}
