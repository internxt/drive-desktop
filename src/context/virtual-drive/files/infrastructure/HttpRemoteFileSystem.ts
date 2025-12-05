import { EncryptionVersion } from '@internxt/sdk/dist/drive/storage/types';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { getNameAndExtension } from '../domain/get-name-and-extension';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { CommonContext } from '@/apps/sync-engine/config';

type Props = {
  ctx: CommonContext;
  contentsId: ContentsId;
  parentUuid: FolderUuid;
  path: AbsolutePath;
  size: number;
};

export class HttpRemoteFileSystem {
  static async persist({ ctx, contentsId, parentUuid, path, size }: Props) {
    const { name, extension } = getNameAndExtension({ path });

    const body = {
      bucket: ctx.bucket,
      fileId: contentsId,
      encryptVersion: EncryptionVersion.Aes03,
      folderUuid: parentUuid,
      plainName: name,
      size,
      type: extension,
    };

    const res = ctx.workspaceId
      ? await driveServerWip.workspaces.createFile({ body, path, workspaceId: ctx.workspaceId, workspaceToken: ctx.workspaceToken })
      : await driveServerWip.files.createFile({ body, path });

    if (res.error?.code === 'FILE_ALREADY_EXISTS') {
      return await driveServerWip.files.checkExistence({ parentUuid, name, extension });
    }

    return res;
  }
}
