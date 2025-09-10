import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
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

      if (error) throw error;

      return data;
    } catch {
      const { data, error } = await driveServerWip.folders.checkExistence({ parentUuid, name: plainName });

      if (error) throw error;

      return data;
    }
  }
}
