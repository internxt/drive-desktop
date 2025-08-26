import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { logger } from '@/apps/shared/logger/logger';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

type TProps = {
  ctx: ProcessSyncContext;
  plainName: string;
  parentUuid: FolderUuid;
  path: RelativePath;
};

export class HttpRemoteFolderSystem {
  static async persist({ ctx, plainName, parentUuid, path }: TProps) {
    const body = {
      plainName,
      name: plainName,
      parentFolderUuid: parentUuid,
    };

    try {
      const { data, error } = ctx.workspaceId
        ? await driveServerWip.workspaces.createFolderInWorkspace({ path, body, workspaceId: ctx.workspaceId })
        : await driveServerWip.folders.createFolder({ path, body });

      if (!data) throw error;

      return data;
    } catch (exc) {
      const existing = await this.existFolder({ plainName, parentUuid });

      if (existing.status !== 'EXISTS') {
        throw logger.error({
          tag: 'SYNC-ENGINE',
          msg: 'Error creating folder',
          path,
          exc,
        });
      }

      return existing;
    }
  }

  static async existFolder(offline: { parentUuid: FolderUuid; plainName: string }) {
    const { data, error } = await driveServerWip.folders.existsFolder({
      parentUuid: offline.parentUuid,
      basename: offline.plainName,
    });

    if (!data) throw error;

    return data.existentFolders[0];
  }
}
