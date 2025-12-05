import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { CommonContext } from '@/apps/sync-engine/config';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { basename } from 'node:path';

type Props = {
  ctx: CommonContext;
  parentUuid: FolderUuid;
  path: AbsolutePath;
};

export class HttpRemoteFolderSystem {
  static async persist({ ctx, parentUuid, path }: Props) {
    const name = basename(path);

    const body = {
      name,
      plainName: name,
      parentFolderUuid: parentUuid,
    };

    const res = ctx.workspaceId
      ? await driveServerWip.workspaces.createFolder({ path, body, workspaceId: ctx.workspaceId, workspaceToken: ctx.workspaceToken })
      : await driveServerWip.folders.createFolder({ path, body });

    if (res.error?.code === 'FOLDER_ALREADY_EXISTS') {
      return await driveServerWip.folders.checkExistence({ parentUuid, name });
    }

    return res;
  }
}
