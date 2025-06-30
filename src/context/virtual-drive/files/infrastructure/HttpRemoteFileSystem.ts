import { EncryptionVersion } from '@internxt/sdk/dist/drive/storage/types';
import { FileAttributes } from '../domain/File';
import { FileStatuses } from '../domain/FileStatus';
import { OfflineFile, OfflineFileAttributes } from '../domain/OfflineFile';
import { Service } from 'diod';
import { client } from '../../../../apps/shared/HttpClient/client';
import { logger } from '@/apps/shared/logger/logger';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

@Service()
export class HttpRemoteFileSystem {
  constructor(
    private readonly bucket: string,
    private readonly workspaceId?: string | null,
  ) {}

  async persist(offline: OfflineFile): Promise<FileAttributes> {
    try {
      const body = {
        bucket: this.bucket,
        fileId: offline.contentsId,
        encryptVersion: EncryptionVersion.Aes03,
        folderUuid: offline.folderUuid,
        plainName: offline.name,
        size: offline.size,
        type: offline.type,
      };

      const { data, error } = this.workspaceId
        ? await driveServerWip.workspaces.createFileInWorkspace({ body, workspaceId: this.workspaceId, path: offline.path })
        : await driveServerWip.files.createFile({ body, path: offline.path });

      if (!data) throw error;

      return {
        id: data.id,
        uuid: data.uuid,
        contentsId: data.fileId,
        folderId: data.folderId,
        folderUuid: data.folderUuid,
        createdAt: data.createdAt,
        modificationTime: data.updatedAt,
        path: offline.path,
        size: Number(data.size),
        updatedAt: data.updatedAt,
        status: FileStatuses.EXISTS,
      };
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

  async getFileByPath(filePath: string): Promise<null | FileAttributes> {
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

    const attributes: FileAttributes = {
      id: data.id,
      uuid: data.uuid,
      contentsId: data.fileId,
      folderId: data.folderId,
      folderUuid: data.folderUuid,
      createdAt: data.createdAt,
      modificationTime: data.modificationTime,
      path: filePath,
      size: Number(data.size),
      status: FileStatuses.EXISTS,
      updatedAt: data.updatedAt,
    };

    return attributes;
  }

  async deleteAndPersist(input: { attributes: OfflineFileAttributes; newContentsId: string }) {
    const { attributes, newContentsId } = input;
    if (!newContentsId) {
      throw new Error('Failed to generate new contents id');
    }

    logger.info({
      msg: `New contents id generated ${newContentsId}, path: ${attributes.path}`,
    });
    await driveServerWip.storage.deleteFile({ fileId: attributes.contentsId });

    logger.info({
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
      logger.info({
        msg: `File not deleted yet, path: ${attributes.path}`,
      });
    }

    if (!isDeleted) {
      throw new Error(`File deletion not confirmed for path: ${attributes.path} after retries`);
    }
    const offlineFile = OfflineFile.from({ ...attributes, contentsId: newContentsId });

    const persistedFile = await this.persist(offlineFile);
    logger.info({
      msg: `File persisted with new contents id ${newContentsId}, path: ${attributes.path}`,
    });

    return persistedFile;
  }
}
