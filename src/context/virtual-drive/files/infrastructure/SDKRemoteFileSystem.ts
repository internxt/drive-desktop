import { Storage } from '@internxt/sdk/dist/drive/storage';
import { EncryptionVersion } from '@internxt/sdk/dist/drive/storage/types';
import { Service } from 'diod';
import Logger from 'electron-log';
import * as uuid from 'uuid';
import { AuthorizedClients } from '../../../../apps/shared/HttpClient/Clients';
import { Crypt } from '../../shared/domain/Crypt';
import { File } from '../domain/File';
import {
  FileDataToPersist,
  PersistedFileData,
  RemoteFileSystem,
} from '../domain/file-systems/RemoteFileSystem';
import { CreateFileDTO } from './dtos/CreateFileDTO';

@Service()
export class SDKRemoteFileSystem implements RemoteFileSystem {
  constructor(
    private readonly sdk: Storage,
    private readonly clients: AuthorizedClients,
    private readonly crypt: Crypt,
    private readonly bucket: string
  ) {}

  async persist(dataToPersists: FileDataToPersist): Promise<PersistedFileData> {
    const encryptedName = this.crypt.encryptName(
      dataToPersists.path.name(),
      dataToPersists.folderId.toString()
    );

    if (!encryptedName) {
      throw new Error('Failed to encrypt name');
    }

    const body: CreateFileDTO = {
      file: {
        fileId: dataToPersists.contentsId.value,
        file_id: dataToPersists.contentsId.value,
        type: dataToPersists.path.extension(),
        size: dataToPersists.size.value,
        name: encryptedName,
        plain_name: dataToPersists.path.name(),
        bucket: this.bucket,
        folder_id: dataToPersists.folderId.value,
        encrypt_version: EncryptionVersion.Aes03,
      },
    };

    const { data } = await this.clients.drive.post(
      `${process.env.API_URL}/api/storage/file`,
      body
    );

    const result: PersistedFileData = {
      modificationTime: data.updatedAt,
      id: data.id,
      uuid: data.uuid,
      createdAt: data.createdAt,
    };

    return result;
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

  async rename(file: File): Promise<void> {
    await this.sdk.updateFile({
      fileId: file.contentsId,
      bucketId: this.bucket,
      destinationPath: uuid.v4(),
      metadata: {
        itemName: file.name,
      },
    });
  }

  async move(file: File): Promise<void> {
    await this.sdk.moveFile({
      fileId: file.contentsId,
      destination: file.folderId,
      destinationPath: uuid.v4(),
      bucketId: this.bucket,
    });
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
}
