import { EncryptionVersion } from '@internxt/sdk/dist/drive/storage/types';
import { Service } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
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
import { createFileIPC, moveFileIPC, renameFileIPC } from '../../../../infra/ipc/files-ipc';
@Service()
export class SDKRemoteFileSystem implements RemoteFileSystem {
  constructor(
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
    const body = {
      bucket: this.bucket,
      fileId: dataToPersists.contentsId.value,
      encryptVersion: EncryptionVersion.Aes03,
      folderUuid: dataToPersists.folderUuid,
      size: dataToPersists.size.value,
      plainName: plainName,
      type: dataToPersists.path.extension(),
    };
    const response = await createFileIPC(body);
    if (response.data) {
      const result: PersistedFileData = {
        modificationTime: response.data.updatedAt,
        id: response.data.id,
        uuid: response.data.uuid,
        createdAt: response.data.createdAt,
      };
      return right(result);
    }
    if (response.error && typeof response.error === 'object' && 'cause' in response.error) {
      const errorCause = (response.error as { cause: string }).cause;
      if (errorCause === 'BAD_REQUEST') {
        return left(
          new DriveDesktopError(
            'BAD_REQUEST',
            `Some data was not valid for ${plainName}: ${body}`
          )
        );
      }
      if (errorCause === 'FILE_ALREADY_EXISTS') {
        return left(
          new DriveDesktopError(
            'FILE_ALREADY_EXISTS',
            `File with name ${plainName} on ${dataToPersists.folderId.value} already exists`
          )
        );
      }
      if (errorCause === 'SERVER_ERROR') {
        return left(
          new DriveDesktopError(
            'BAD_RESPONSE',
            `The server could not handle the creation of ${plainName}: ${body}`
          )
        );
      }
    }
    return left(
      new DriveDesktopError(
        'UNKNOWN',
        `Creating file ${plainName}: ${response.error}`
      )
    );
  }

  async trash(contentsId: string): Promise<void> {
    const result = await this.clients.newDrive.post(
      `${process.env.NEW_DRIVE_URL}/storage/trash/add`,
      {
        items: [{ type: 'file', id: contentsId }],
      }
    );

    if (result.status !== 200) {
      logger.error({
        msg: '[FILE SYSTEM] File deletion failed with status:',
        status: result.status,
        statusText: result.statusText,
      });

      throw new Error('Error when deleting file');
    }
  }

  async delete(file: File): Promise<void> {
    await this.trash(file.contentsId);
  }

  async rename(file: File): Promise<void> {
    await renameFileIPC({
      plainName: file.name,
      type: file.type,
      fileUuid: file.uuid,
    });
  }

  async move(file: File, destinationFolderUuid: string): Promise<void> {
    await moveFileIPC({
      uuid: file.uuid,
      destinationFolder: destinationFolderUuid,
    });
  }

  async override(file: File): Promise<void> {
    await this.clients.newDrive.put(
      `${process.env.NEW_DRIVE_URL}/files/${file.uuid}`,
      {
        fileId: file.contentsId,
        size: file.size,
      }
    );

    logger.debug({
      msg: `File ${file.path} overridden`,
    });
  }

  async hardDelete(contentsId: string): Promise<void> {
    const result = await this.clients.newDrive.delete(
      `${process.env.NEW_DRIVE_URL}/storage/trash/file/${contentsId}`
    );
    if (result.status > 204) {
      logger.error({
        msg: '[FILE SYSTEM] Hard delete failed with status:',
        status: result.status,
      });

      throw new Error('Error when hard deleting file');
    }
  }
}
