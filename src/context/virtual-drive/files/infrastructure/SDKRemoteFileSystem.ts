import { Storage } from '@internxt/sdk/dist/drive/storage';
import { EncryptionVersion } from '@internxt/sdk/dist/drive/storage/types';
import { Crypt } from '../../shared/domain/Crypt';
import { File, FileAttributes } from '../domain/File';
import { FileStatuses } from '../domain/FileStatus';
import { OfflineFile } from '../domain/OfflineFile';
import * as uuidv4 from 'uuid';
import { AuthorizedClients } from '../../../../apps/shared/HttpClient/Clients';
import Logger from 'electron-log';
import { isAxiosError } from 'axios';
import { Service } from 'diod';

@Service()
export class SDKRemoteFileSystem {
  constructor(
    private readonly sdk: Storage,
    private readonly clients: AuthorizedClients,
    private readonly crypt: Crypt,
    private readonly bucket: string,
  ) {}

  async persist(offline: OfflineFile): Promise<FileAttributes> {
    const encryptedName = this.crypt.encryptName(offline.name, offline.folderId.toString());

    if (!encryptedName) {
      throw new Error('Failed to encrypt name');
    }

    Logger.info(`Creating file ${offline.name} in folder ${offline.folderId}`);
    Logger.info(`Encrypted name: ${offline.path}`);

    try {
      const data = await this.sdk.createFileEntry({
        id: offline.contentsId,
        type: offline.type,
        size: offline.size,
        name: encryptedName,
        plain_name: offline.name,
        bucket: this.bucket,
        folder_id: offline.folderId,
        encrypt_version: EncryptionVersion.Aes03,
      });

      return {
        ...data,
        contentsId: data.fileId,
        modificationTime: data.updatedAt,
        path: offline.path,
        status: FileStatuses.EXISTS,
      };
    } catch (error) {
      Logger.error('Error creating file entry', error);

      const existingFile = await this.getFileByPath(offline.path);
      Logger.info('Existing file', existingFile);

      if (existingFile) return existingFile;

      throw new Error('Failed to create file and no existing file found');
    }
  }

  async trash(contentsId: string): Promise<void> {
    const result = await this.clients.newDrive.post(`${process.env.NEW_DRIVE_URL}/drive/storage/trash/add`, {
      items: [{ type: 'file', id: contentsId }],
    });

    if (result.status !== 200) {
      Logger.error('[FILE FILE SYSTEM] File deletion failed with status: ', result.status, result.statusText);

      throw new Error('Error when deleting file');
    }
  }

  async delete(file: File): Promise<void> {
    await this.trash(file.contentsId);
  }

  async rename(file: File): Promise<void> {
    await this.sdk.updateFile({
      fileId: file.contentsId,
      bucketId: this.bucket,
      destinationPath: uuidv4.v4(),
      metadata: {
        itemName: file.name,
      },
    });
  }

  async move(file: File): Promise<void> {
    await this.sdk.moveFile({
      fileId: file.contentsId,
      destination: Number(file.folderId.value),
      destinationPath: uuidv4.v4(),
      bucketId: this.bucket,
    });
  }

  async replace(file: File, newContentsId: File['contentsId'], newSize: File['size']): Promise<void> {
    await this.clients.newDrive.put(`${process.env.NEW_DRIVE_URL}/drive/files/${file.uuid}`, {
      fileId: newContentsId,
      size: newSize,
    });
  }

  async override(file: File): Promise<void> {
    await this.clients.newDrive.put(`${process.env.NEW_DRIVE_URL}/drive/files/${file.uuid}`, {
      fileId: file.contentsId,
      size: file.size,
    });

    Logger.info(`File ${file.path} overridden`);
  }

  async getFileByPath(filePath: string): Promise<null | FileAttributes> {
    try {
      const response = await this.clients.newDrive.get(`${process.env.NEW_DRIVE_URL}/drive/files/meta?path=${filePath}`);

      Logger.info('Response from getFileByPath', response.data);

      if (response.data.status !== FileStatuses.EXISTS) return null;

      const attibutes: FileAttributes = {
        id: response.data.id,
        uuid: response.data.uuid,
        contentsId: response.data.fileId,
        folderId: response.data.folderId,
        folderUuid: response.data.folderUuid,
        createdAt: response.data.createdAt,
        modificationTime: response.data.modificationTime,
        path: filePath,
        size: response.data.size,
        status: FileStatuses.EXISTS,
        updatedAt: response.data.updatedAt,
      };

      return attibutes;
    } catch (error) {
      if (isAxiosError(error)) {
        Logger.error('Error getting file by folder and name', error.response?.status, error.response?.data);
      }
      return null;
    }
  }
}
