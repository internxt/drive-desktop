import { Storage } from '@internxt/sdk/dist/drive/storage';
import { EncryptionVersion } from '@internxt/sdk/dist/drive/storage/types';
import { Crypt } from '../../shared/domain/Crypt';
import { File, FileAttributes } from '../domain/File';
import { FileStatuses } from '../domain/FileStatus';
import {
  FileDataToPersist,
  PersistedFileData,
} from '../domain/file-systems/RemoteFileSystem';
import { OfflineFile } from '../domain/OfflineFile';
import * as uuidv4 from 'uuid';
import { AuthorizedClients } from '../../../../apps/shared/HttpClient/Clients';
import Logger from 'electron-log';
import { Either, left, right } from '../../../shared/domain/Either';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';
import { isAxiosError } from 'axios';
import { CreateFileDTO } from './dtos/CreateFileDTO';
import { Service } from 'diod';
import { Folder } from '../../folders/domain/Folder';
import { FolderStatuses } from '../../folders/domain/FolderStatus';

@Service()
export class SDKRemoteFileSystem {
  constructor(
    private readonly sdk: Storage,
    private readonly clients: AuthorizedClients,
    private readonly crypt: Crypt,
    private readonly bucket: string
  ) {}

  async persist(offline: OfflineFile): Promise<FileAttributes> {
    const encryptedName = this.crypt.encryptName(
      offline.name,
      offline.folderId.toString()
    );

    if (!encryptedName) {
      throw new Error('Failed to encrypt name');
    }

    Logger.info(`Creating file ${offline.name} in folder ${offline.folderId}`);
    Logger.info(`Encrypted name: ${offline.path}`);
    const existingFile = await this.getFileByPath(offline.path);

    Logger.info('Existing file', existingFile);

    if (existingFile) return existingFile;

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
  }

  async persistv2(
    dataToPersists: FileDataToPersist
  ): Promise<Either<DriveDesktopError, PersistedFileData>> {
    const plainName = dataToPersists.path.name();

    const encryptedName = this.crypt.encryptName(
      plainName,
      dataToPersists.folderId.value.toString()
    );

    if (!encryptedName) {
      return left(
        new DriveDesktopError(
          'COULD_NOT_ENCRYPT_NAME',
          `Could not encrypt the file name: ${plainName} with salt: ${dataToPersists.folderId.value.toString()}`
        )
      );
    }

    const body: CreateFileDTO = {
      file: {
        fileId: dataToPersists.contentsId.value,
        file_id: dataToPersists.contentsId.value,
        type: dataToPersists.path.extension(),
        size: dataToPersists.size.value,
        name: encryptedName,
        plain_name: plainName,
        bucket: this.bucket,
        folder_id: dataToPersists.folderId.value,
        encrypt_version: EncryptionVersion.Aes03,
        modificationTime: new Date(),
      },
    };

    try {
      const { data } = await this.clients.drive.post(
        `${process.env.API_URL}/storage/file`,
        body
      );

      const result: PersistedFileData = {
        modificationTime: data.updatedAt,
        id: data.id,
        uuid: data.uuid,
        createdAt: data.createdAt,
      };

      return right(result);
    } catch (err: unknown) {
      if (!isAxiosError(err) || !err.response) {
        return left(
          new DriveDesktopError('UNKNOWN', `Creating file ${plainName}: ${err}`)
        );
      }

      const { status } = err.response;

      if (status === 400) {
        return left(
          new DriveDesktopError(
            'BAD_REQUEST',
            `Some data was not valid for ${plainName}: ${body.file}`
          )
        );
      }

      if (status === 409) {
        return left(
          new DriveDesktopError(
            'FILE_ALREADY_EXISTS',
            `File with name ${plainName} on ${dataToPersists.folderId.value} already exists`
          )
        );
      }

      if (status >= 500) {
        return left(
          new DriveDesktopError(
            'BAD_RESPONSE',
            `The server could not handle the creation of ${plainName}: ${body.file}`
          )
        );
      }

      return left(
        new DriveDesktopError(
          'UNKNOWN',
          `Response with status ${status} not expected`
        )
      );
    }
  }

  async checkStatusFile(uuid: File['uuid']): Promise<FileStatuses> {
    Logger.info(`Checking status for file ${uuid}`);
    const response = await this.clients.newDrive.get(
      `${process.env.NEW_DRIVE_URL}/drive/files/${uuid}/meta`
    );

    if (response.status === 404) {
      return FileStatuses.DELETED;
    }

    if (response.status !== 200) {
      Logger.error(
        '[FILE FILE SYSTEM] Error checking file status',
        response.status,
        response.statusText
      );
      throw new Error('Error checking file status');
    }

    return response.data.status as FileStatuses;
  }

  async checkStatusFolder(uuid: Folder['uuid']): Promise<FolderStatuses> {
    Logger.info(`Checking status for folder 2 ${uuid}`);

    const response = await this.clients.newDrive.get(
      `${process.env.NEW_DRIVE_URL}/drive/folders/${uuid}/meta`
    );

    if (response.status === 404) {
      return FolderStatuses.DELETED;
    }

    if (response.status !== 200) {
      Logger.error(
        '[FOLDER FILE SYSTEM] Error checking folder status',
        response.status,
        response.statusText
      );
      throw new Error('Error checking folder status');
    }

    return response.data.status as FolderStatuses;
  }

  async trash(contentsId: string): Promise<void> {
    const result = await this.clients.newDrive.post(
      `${process.env.NEW_DRIVE_URL}/drive/storage/trash/add`,
      {
        items: [{ type: 'file', id: contentsId }],
      }
    );

    if (result.status !== 200) {
      Logger.error(
        '[FILE FILE SYSTEM] File deletion failed with status: ',
        result.status,
        result.statusText
      );

      throw new Error('Error when deleting file');
    }
  }

  async delete(file: File): Promise<void> {
    await this.trash(file.contentsId);
  }

  async hardDelete(contentsId: string) {
    const result = await this.clients.newDrive.delete(
      `${process.env.NEW_DRIVE_URL}/drive/storage/trash`,
      {
        data: { items: [contentsId] },
      }
    );

    if (result.status !== 200) {
      Logger.error(
        '[FILE FILE SYSTEM] Hard delete failed with status: ',
        result.status,
        result.statusText
      );

      throw new Error('Error when hard deleting file');
    }
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

  async replace(
    file: File,
    newContentsId: File['contentsId'],
    newSize: File['size']
  ): Promise<void> {
    await this.clients.newDrive.put(
      `${process.env.NEW_DRIVE_URL}/drive/files/${file.uuid}`,
      {
        fileId: newContentsId,
        size: newSize,
      }
    );
  }

  async override(file: File): Promise<void> {
    await this.clients.newDrive.put(
      `${process.env.NEW_DRIVE_URL}/drive/files/${file.uuid}`,
      {
        fileId: file.contentsId,
        size: file.size,
      }
    );

    Logger.info(`File ${file.path} overridden`);
  }

  async getFileByPath(filePath: string): Promise<null | FileAttributes> {
    try {
      const response = await this.clients.newDrive.get(
        `${process.env.NEW_DRIVE_URL}/drive/files/meta?path=${filePath}`
      );

      Logger.info('Response from getFileByPath', response.data);

      if (response.data.status !== FileStatuses.EXISTS) return null;

      const attibutes: FileAttributes = {
        id: response.data.id,
        uuid: response.data.uuid,
        contentsId: response.data.fileId,
        folderId: response.data.folderId,
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
        Logger.error(
          'Error getting file by folder and name',
          error.response?.status,
          error.response?.data
        );
      }
      return null;
    }
  }
}
