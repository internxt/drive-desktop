import { Storage } from '@internxt/sdk/dist/drive/storage';
import { EncryptionVersion } from '@internxt/sdk/dist/drive/storage/types';
import { isAxiosError } from 'axios';
import { Service } from 'diod';
import Logger from 'electron-log';
import * as uuid from 'uuid';
import { AuthorizedClients } from '../../../../apps/shared/HttpClient/Clients';
import { Either, left, right } from '../../../shared/domain/Either';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';
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

  async persist(
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
