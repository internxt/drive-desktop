import { EncryptionVersion } from '@internxt/sdk/dist/drive/storage/types';
import { Crypt } from '../../shared/domain/Crypt';
import { File, FileAttributes } from '../domain/File';
import { FileStatuses } from '../domain/FileStatus';
import { OfflineFile } from '../domain/OfflineFile';
import Logger from 'electron-log';
import { Service } from 'diod';
import { PersistFileDto, PersistFileResponseDto } from './dtos/client.dto';
import { client } from '../../../../apps/shared/HttpClient/client';

@Service()
export class HttpRemoteFileSystem {
  constructor(
    private readonly crypt: Crypt,
    private readonly bucket: string,

    private readonly workspaceId?: string,
  ) {}

  async persist(offline: OfflineFile): Promise<FileAttributes> {
    try {
      const encryptedName = this.crypt.encryptName(offline.name, offline.folderId.toString());

      if (!encryptedName) {
        throw new Error('Failed to encrypt name');
      }

      Logger.info(`Creating file ${offline.name} in folder ${offline.folderId}`);
      Logger.info(`Encrypted name: ${offline.path}`);

      const body: PersistFileDto = {
        bucket: this.bucket,
        fileId: offline.contentsId,
        encryptVersion: EncryptionVersion.Aes03,
        folderUuid: offline.folderUuid,
        plainName: offline.name,
        size: offline.size,
        type: offline.type,
      };

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
      Logger.error('Error persisting file: ', error);

      const existingFile = await this.getFileByPath(offline.path);
      Logger.info('Existing file', existingFile);

      if (existingFile) return existingFile;

      throw new Error('Failed to create file and no existing file found');
    }
  }

  private async createFile(body: PersistFileDto): Promise<PersistFileResponseDto> {
    try {
      const response = await client.POST('/files', {
        body,
      });

      if (response.error) {
        Logger.error({
          message: 'Error creating file entry',
          error: response,
        });

        throw new Error('Error creating file entry');
      }

      return response.data;
    } catch (error) {
      Logger.error('Error creating file entry', error);
      throw new Error('Failed to create file and no existing file found');
    }
  }

  private async createFileInWorkspace(body: PersistFileDto, workspaceId: string): Promise<PersistFileResponseDto> {
    try {
      const response = await client.POST('/workspaces/{workspaceId}/files', {
        params: {
          path: {
            workspaceId,
          },
        },
        body,
      });

      if (response.error) {
        Logger.error({
          message: 'Error creating file entry',
          error: response,
        });
        throw new Error('Error creating file entry');
      }

      return response.data;
    } catch (error) {
      Logger.error('Error creating file entry', error);
      throw new Error('Failed to create file and no existing file found');
    }
  }
  async delete(file: File): Promise<void> {
    try {
      const response = await client.POST('/storage/trash/add', {
        body: {
          items: [{ type: 'file', uuid: file.uuid, id: null }],
        },
      });
      if (response.error) {
        Logger.error({
          message: 'Error trashing file',
          error: response.response,
        });
        throw new Error('Error trashing file');
      }
    } catch (error) {
      Logger.error('Error trashing file', error);
      throw error;
    }
  }

  async rename(file: File): Promise<void> {
    try {
      const response = await client.PUT('/files/{uuid}/meta', {
        body: { plainName: file.name, type: file.type },
        params: {
          path: {
            uuid: file.uuid,
          },
        },
      });
      if (response.error) {
        Logger.error({
          message: 'Error renaming file',
          error: response,
        });
        throw new Error('Error renaming file');
      }
    } catch (error) {
      Logger.error('Error renaming file', error);
      throw error;
    }
  }

  async move(file: File): Promise<void> {
    try {
      const response = await client.PATCH('/files/{uuid}', {
        body: { destinationFolder: file.folderUuid.value },
        params: {
          path: {
            uuid: file.uuid,
          },
        },
      });
      if (response.error) {
        Logger.error({
          message: 'Error moving file',
          error: response.response,
          errorData: response.error,
        });

        throw new Error('Error moving file');
      }
    } catch (error) {
      Logger.error('Error moving file', error);
      throw error;
    }
  }

  async replace(file: File, newContentsId: File['contentsId'], newSize: File['size']): Promise<void> {
    try {
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
      if (response.error) {
        Logger.error({
          message: 'Error moving file',
          error: response,
        });
        throw new Error('Error moving file');
      }
    } catch (error) {
      Logger.error('Error moving file', error);
      throw error;
    }
  }

  async override(file: File): Promise<void> {
    try {
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
      if (response.error) {
        Logger.error({
          message: 'Error moving file',
          error: response,
        });
        throw new Error('Error moving file');
      }
    } catch (error) {
      Logger.error('Error moving file', error);
      throw error;
    }
  }

  async getFileByPath(filePath: string): Promise<null | FileAttributes> {
    try {
      const response = await client.GET('/files/meta', {
        params: {
          query: {
            path: filePath,
          },
        },
      });
      if (response.error) {
        Logger.error({
          message: 'Error getting file by path',
          error: response,
        });
        throw new Error('Error getting file by path');
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
    } catch (error) {
      return null;
    }
  }
}
