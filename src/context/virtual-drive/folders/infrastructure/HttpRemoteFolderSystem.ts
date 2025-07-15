import { FolderAttributes } from '../domain/Folder';
import { Service } from 'diod';
import { FolderStatuses } from '../domain/FolderStatus';
import { logger } from '@/apps/shared/logger/logger';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

@Service()
export class HttpRemoteFolderSystem {
  constructor(private readonly workspaceId?: string) {}

  async persist(offline: { basename: string; parentUuid: string; path: string }) {
    if (!offline.basename) {
      throw new Error('Bad folder name');
    }

    const body = {
      plainName: offline.basename,
      name: offline.basename,
      parentFolderUuid: offline.parentUuid,
    };

    try {
      const { data, error } = this.workspaceId
        ? await driveServerWip.workspaces.createFolderInWorkspace({ path: offline.path, body, workspaceId: this.workspaceId })
        : await driveServerWip.folders.createFolder({ path: offline.path, body });

      if (!data) throw error;

      return {
        dto: data,
        id: data.id,
        uuid: data.uuid,
        parentId: data.parentId,
        parentUuid: data.parentUuid,
        path: offline.path,
        updatedAt: data.updatedAt,
        createdAt: data.createdAt,
        status: FolderStatuses.EXISTS,
      };
    } catch (exc) {
      const existing = await this.existFolder(offline);

      if (existing.status !== FolderStatuses.EXISTS) {
        throw logger.error({
          tag: 'SYNC-ENGINE',
          msg: 'Error creating folder',
          basename: offline.basename,
          parentUuid: offline.parentUuid,
          exc,
        });
      }

      return existing;
    }
  }

  private async existFolder(offline: { parentUuid: string; basename: string; path: string }) {
    const { data, error } = await driveServerWip.folders.existsFolder({
      parentUuid: offline.parentUuid,
      basename: offline.basename,
    });
    if (!data) throw error;
    return {
      dto: data.existentFolders[0],
      ...data.existentFolders[0],
      path: offline.path,
    };
  }
}
