import { EncryptionVersion } from '@internxt/sdk/dist/drive/storage/types';
import { FileStatuses } from '../domain/FileStatus';
import { OfflineFileAttributes } from '../domain/OfflineFile';
import { client } from '../../../../apps/shared/HttpClient/client';
import { logger } from '@/apps/shared/logger/logger';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { basename } from 'path';
import { getNameAndExtension } from '../domain/get-name-and-extension';

type Props = {
  ctx: { bucket: string; workspaceId?: string };
  contentsId: string;
  folderUuid: string;
  path: string;
  size: number;
};

export class HttpRemoteFileSystem {
  static async persist({ ctx, ...offline }: Props) {
    try {
      const { name, extension } = getNameAndExtension({ nameWithExtension: basename(offline.path) });

      const body = {
        bucket: ctx.bucket,
        fileId: offline.contentsId,
        encryptVersion: EncryptionVersion.Aes03,
        folderUuid: offline.folderUuid,
        plainName: name,
        size: offline.size,
        type: extension,
      };

      const { data, error } = ctx.workspaceId
        ? await driveServerWip.workspaces.createFileInWorkspace({ body, workspaceId: ctx.workspaceId, path: offline.path })
        : await driveServerWip.files.createFile({ body, path: offline.path });

      if (!data) throw error;

      return data;
    } catch (error) {
      logger.error({
        msg: 'Error persisting file',
        exc: error,
      });

      const existingFile = await this.getFileByPath(offline.path);
      logger.debug({
        msg: 'Existing file',
        existingFile,
      });

      if (existingFile) return existingFile;

      throw logger.error({
        msg: 'Failed to persist file and no existing file found',
      });
    }
  }

  static async getFileByPath(filePath: string) {
    const response = await client.GET('/files/meta', {
      params: {
        query: {
          path: filePath,
        },
      },
    });
    if (!response.data) {
      logger.error({
        msg: 'Error getting file by path',
        error: response.error,
      });
      return null;
    }

    const data = response.data;
    if (data.status !== FileStatuses.EXISTS) return null;

    return data;
  }

  static async deleteAndPersist(input: {
    ctx: { bucket: string; workspaceId: string | undefined };
    attributes: OfflineFileAttributes;
    newContentsId: string;
  }) {
    const { ctx, attributes, newContentsId } = input;
    if (!newContentsId) {
      throw new Error('Failed to generate new contents id');
    }

    logger.debug({
      msg: `New contents id generated ${newContentsId}, path: ${attributes.path}`,
    });
    await driveServerWip.storage.deleteFile({ fileId: attributes.contentsId });

    logger.debug({
      msg: `Deleted file with contents id ${attributes.contentsId}, path: ${attributes.path}`,
    });

    const delays = [50, 100, 200];
    let isDeleted = false;

    for (const delay of delays) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      const fileCheck = await this.getFileByPath(attributes.path);
      if (!fileCheck) {
        isDeleted = true;
        break;
      }
      logger.debug({
        msg: `File not deleted yet, path: ${attributes.path}`,
      });
    }

    if (!isDeleted) {
      throw new Error(`File deletion not confirmed for path: ${attributes.path} after retries`);
    }

    const persistedFile = await this.persist({ ctx, ...attributes, contentsId: newContentsId });
    logger.debug({
      msg: `File persisted with new contents id ${newContentsId}, path: ${attributes.path}`,
    });

    return persistedFile;
  }
}
