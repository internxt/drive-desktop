import { FolderStatuses } from '../domain/FolderStatus';
import { logger } from '@/apps/shared/logger/logger';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

type TProps = {
  plainName: string;
  parentUuid: string;
  path: string;
};

export class HttpRemoteFolderSystem {
  constructor(private readonly workspaceId: string) {}

  async persist(offline: TProps) {
    const body = {
      plainName: offline.plainName,
      name: offline.plainName,
      parentFolderUuid: offline.parentUuid,
    };

    try {
      const { data, error } = this.workspaceId
        ? await driveServerWip.workspaces.createFolderInWorkspace({ path: offline.path, body, workspaceId: this.workspaceId })
        : await driveServerWip.folders.createFolder({ path: offline.path, body });

      if (!data) throw error;

      return data;
    } catch (exc) {
      const existing = await this.existFolder(offline);

      if (existing.status !== FolderStatuses.EXISTS) {
        throw logger.error({
          tag: 'SYNC-ENGINE',
          msg: 'Error creating folder',
          path: offline.path,
          exc,
        });
      }

      return existing;
    }
  }

  private async existFolder(offline: TProps) {
    const { data, error } = await driveServerWip.folders.existsFolder({
      parentUuid: offline.parentUuid,
      basename: offline.plainName,
    });

    if (!data) throw error;

    return data.existentFolders[0];
  }
}
