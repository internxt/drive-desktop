/* eslint-disable no-await-in-loop */
import { EncryptionVersion } from '@internxt/sdk/dist/drive/storage/types';
import { Crypt } from '../../shared/domain/Crypt';
import { File, FileAttributes } from '../domain/File';
import { FileStatuses } from '../domain/FileStatus';
import { OfflineFile, OfflineFileAttributes } from '../domain/OfflineFile';
import { Service } from 'diod';
import { PersistFileDto, PersistFileResponseDto } from './dtos/client.dto';
import { client } from '../../../../apps/shared/HttpClient/client';
import { logger } from '@/apps/shared/logger/logger';

@Service()
export class HttpRemoteFileSystem {
  constructor(
    private readonly crypt: Crypt,
    private readonly bucket: string,

    private readonly workspaceId?: string | null,
  ) {}

  async persist(offline: OfflineFile): Promise<FileAttributes> {
    try {
      const encryptedName = this.crypt.encryptName(offline.name, offline.folderId.toString());

      if (!encryptedName) {
        throw new Error('Failed to encrypt name');
      }

      const body: PersistFileDto = {
        bucket: this.bucket,
        fileId: offline.contentsId,
        encryptVersion: EncryptionVersion.Aes03,
        folderUuid: offline.folderUuid,
        plainName: offline.name,
        size: offline.size,
        type: offline.type,
      };

      logger.debug({
        msg: `Creating file ${offline.name} in folder ${offline.folderId}`,
        offline,
        body,
      });

      const result = this.workspaceId ? await this.createFileInWorkspace(body, this.workspaceId) : await this.createFile(body);

      return {
        id: result.id,
        uuid: result.uuid,
        contentsId: result.fileId,
        folderId: result.folderId,
        folderUuid: result.folderUuid,
        createdAt: result.createdAt,
        modificationTime: result.updatedAt,
        path: offline.path,
        size: result.size,
        updatedAt: result.updatedAt,
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
  private async createFile(body: PersistFileDto): Promise<PersistFileResponseDto> {
    const response = await client.POST('/files', {
      body,
    });

    if (!response.data) {
      throw logger.error({
        msg: 'Error creating file entry',
        exc: response.error,
      });
    }

    return response.data;
  }
  private async createFileInWorkspace(body: PersistFileDto, workspaceId: string): Promise<PersistFileResponseDto> {
    const response = await client.POST('/workspaces/{workspaceId}/files', {
      params: {
        path: {
          workspaceId,
        },
      },
      body,
    });

    if (!response.data) {
      throw logger.error({
        msg: 'Error creating file entry in workspaces',
        error: response.error,
      });
    }

    return response.data;
  }
  async delete(file: File): Promise<void> {
    const response = await client.POST('/storage/trash/add', {
      body: {
        items: [{ type: 'file', uuid: file.uuid, id: null }],
      },
    });

    if (!response.data) {
      throw logger.error({
        msg: 'Error trashing file',
        error: response.error,
      });
    }
  }

  async rename(file: File): Promise<void> {
    const response = await client.PUT('/files/{uuid}/meta', {
      body: { plainName: file.name, type: file.type },
      params: {
        path: {
          uuid: file.uuid,
        },
      },
    });

    if (!response.data) {
      throw logger.error({
        msg: 'Error renaming file',
        error: response.error,
      });
    }
  }
  async move(file: File): Promise<void> {
    const response = await client.PATCH('/files/{uuid}', {
      body: { destinationFolder: file.folderUuid.value },
      params: {
        path: {
          uuid: file.uuid,
        },
      },
    });

    if (!response.data) {
      throw logger.error({
        msg: 'Error moving file',
        error: response.error,
      });
    }
  }

  async replace(file: File, newContentsId: File['contentsId'], newSize: File['size']): Promise<void> {
    const response = await client.PUT('/files/{uuid}', {
      body: {
        fileId: newContentsId,
        size: newSize,
      },
      params: {
        path: {
          uuid: file.uuid,
        },
      },
    });

    if (!response.data) {
      throw logger.error({
        msg: 'Error moving file',
        error: response.error,
      });
    }
  }

  async override(file: File): Promise<void> {
    const response = await client.PUT('/files/{uuid}', {
      body: {
        fileId: file.contentsId,
        size: file.size,
      },
      params: {
        path: {
          uuid: file.uuid,
        },
      },
    });

    if (!response.data) {
      throw logger.error({
        msg: 'Error moving file',
        error: response.error,
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
      size: data.size,
      status: FileStatuses.EXISTS,
      updatedAt: data.updatedAt,
    };

    return attributes;
  }
  async hardDelete(fileId: string): Promise<void> {
    const result = await client.DELETE('/storage/trash/file/{fileId}', {
      params: {
        path: {
          fileId,
        },
      },
    });

    if (result.error) {
      logger.error({
        msg: 'Error hard deleting file',
        exc: result as unknown,
      });
    }
  }

  async deleteAndPersist(input: { attributes: OfflineFileAttributes; newContentsId: string }) {
    const { attributes, newContentsId } = input;
    if (!newContentsId) {
      throw new Error('Failed to generate new contents id');
    }

    logger.info({
      msg: `New contents id generated ${newContentsId}, path: ${attributes.path}`,
    });
    await this.hardDelete(attributes.contentsId);

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
