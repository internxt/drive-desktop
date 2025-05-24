import { Folder, FolderAttributes } from '../domain/Folder';
import { Service } from 'diod';
import { FolderStatuses } from '../domain/FolderStatus';
import { logger } from '@/apps/shared/logger/logger';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { retryWrapper } from '@/infra/drive-server-wip/out/retry-wrapper';
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
      const promise = () =>
        this.workspaceId
          ? driveServerWip.workspaces.createFolderInWorkspace({ body, workspaceId: this.workspaceId })
          : driveServerWip.folders.createFolder({ body });

      const { data, error } = await retryWrapper({
        promise,
        loggerBody: {
          msg: 'Error creating folder',
        },
      });

      if (!data) throw error;

      return {
        id: data.id,
        uuid: data.uuid,
        parentId: data.parentId,
        parentUuid: data.parentUuid,
        path: offline.path,
        updatedAt: data.updatedAt,
        createdAt: data.createdAt,
        status: FolderStatuses.EXISTS,
      };
    } catch (error) {
      logger.error({
        msg: 'Error creating folder',
        exc: error,
      });

      const existing = await this.existFolder(offline);
      return existing.status !== FolderStatuses.EXISTS ? Promise.reject(error) : existing;
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
