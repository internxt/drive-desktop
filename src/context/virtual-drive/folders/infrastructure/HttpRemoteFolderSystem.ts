import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

type TProps = {
  workspaceId: string;
  plainName: string;
  parentUuid: FolderUuid;
  path: string;
};

export class HttpRemoteFolderSystem {
  static async persist({ workspaceId, plainName, parentUuid, path }: TProps) {
    const body = {
      plainName,
      name: plainName,
      parentFolderUuid: parentUuid,
    };

    const res = workspaceId
      ? await driveServerWip.workspaces.createFolderInWorkspace({ path, body, workspaceId })
      : await driveServerWip.folders.createFolder({ path, body });

    if (res.error) {
      return await driveServerWip.folders.checkExistence({ parentUuid, name: plainName });
    }

    return res;
  }
}
