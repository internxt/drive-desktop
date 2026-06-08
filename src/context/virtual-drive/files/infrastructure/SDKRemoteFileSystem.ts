import { EncryptionVersion } from '@internxt/sdk/dist/drive/storage/types';
import { Service } from 'diod';
import { Either, left, right } from '../../../shared/domain/Either';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';
import { FileDataToPersist, PersistedFileData, RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { CreateFileDto } from '../../../../infra/drive-server/out/dto';
import { createFile } from '../../../../infra/drive-server/services/files/services/create-file';
import { parseRetryAfterMs } from '../../../../backend/common/rate-limit/transient-error-handler';

@Service()
export class SDKRemoteFileSystem implements RemoteFileSystem {
  constructor(private readonly bucket: string) {}

  async persist(dataToPersists: FileDataToPersist): Promise<Either<DriveDesktopError, PersistedFileData>> {
    const plainName = dataToPersists.path.name();
    const body: CreateFileDto = {
      bucket: this.bucket,
      fileId: undefined,
      encryptVersion: EncryptionVersion.Aes03,
      folderUuid: dataToPersists.folderUuid,
      size: dataToPersists.size.value,
      plainName,
      type: dataToPersists.path.extension(),
    };

    if (dataToPersists.size.value > 0) {
      body.fileId = dataToPersists.contentsId.value;
    }

    const { data, error } = await createFile(body);
    if (data) {
      const result: PersistedFileData = {
        modificationTime: data.updatedAt,
        id: data.id,
        uuid: data.uuid,
        createdAt: data.createdAt,
      };
      return right(result);
    } else {
      const errorCause = error.cause;
      if (errorCause === 'BAD_REQUEST') {
        return left(new DriveDesktopError('BAD_REQUEST', `Some data was not valid for ${plainName}: ${body}`));
      }
      if (errorCause === 'CONFLICT') {
        return left(
          new DriveDesktopError(
            'FILE_ALREADY_EXISTS',
            `File with name ${plainName} on ${dataToPersists.folderId.value} already exists`,
          ),
        );
      }
      if (errorCause === 'SERVER_ERROR') {
        return left(new DriveDesktopError('INTERNAL_SERVER_ERROR', error.message));
      }
      if (errorCause === 'TOO_MANY_REQUESTS') {
        return left(new DriveDesktopError('RATE_LIMITED', String(parseRetryAfterMs(error.message))));
      }
      if (errorCause === 'FILE_TOO_BIG') {
        return left(new DriveDesktopError('FILE_TOO_BIG', error.message));
      }
      return left(new DriveDesktopError('UNKNOWN', `Creating file ${plainName}: ${error}`));
    }
  }
}
