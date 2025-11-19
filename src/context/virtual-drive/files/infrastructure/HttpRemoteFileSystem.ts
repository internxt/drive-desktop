import { EncryptionVersion } from '@internxt/sdk/dist/drive/storage/types';
import { logger } from '@/apps/shared/logger/logger';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { getNameAndExtension } from '../domain/get-name-and-extension';
import { restoreParentFolder } from './restore-parent-folder';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

export class HttpRemoteFileSystem {
  static async create(offline: {
    bucket: string;
    contentsId: string;
    folderUuid: string;
    path: string;
    size: number;
    workspaceId: string;
  }) {
    const { name, extension } = getNameAndExtension({ path: offline.path });

    const body = {
      bucket: offline.bucket,
      fileId: offline.contentsId,
      encryptVersion: EncryptionVersion.Aes03,
      folderUuid: offline.folderUuid,
      plainName: name,
      size: offline.size,
      type: extension,
    };

    const res = offline.workspaceId
      ? await driveServerWip.workspaces.createFile({ body, workspaceId: offline.workspaceId, path: offline.path })
      : await driveServerWip.files.createFile({ body, path: offline.path });

    if (res.error?.code === 'FILE_ALREADY_EXISTS') {
      return await driveServerWip.files.checkExistence({ parentUuid: offline.folderUuid, name, extension });
    }

    return res;
  }

  static async persist(ctx: ProcessSyncContext, offline: { contentsId: string; folderUuid: string; path: AbsolutePath; size: number }) {
    const props = {
      ...offline,
      bucket: ctx.bucket,
      workspaceId: ctx.workspaceId,
    };

    const { data, error } = await HttpRemoteFileSystem.create(props);

    if (data) return data;

    if (error.code === 'FOLDER_NOT_FOUND') {
      await restoreParentFolder({ ctx, offline });
      const { data } = await HttpRemoteFileSystem.create(props);
      if (data) return data;
    }

    throw logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Failed to persist file',
      path: offline.path,
      error,
    });
  }
}
