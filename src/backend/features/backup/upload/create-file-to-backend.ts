import path from 'node:path';
import { EncryptionVersion } from '@internxt/sdk/dist/drive/storage/types';
import { DriveDesktopError } from '../../../../context/shared/domain/errors/DriveDesktopError';
import { SyncError } from '../../../../shared/issues/SyncErrorCause';
import { Result } from '../../../../context/shared/domain/Result';
import { File } from '../../../../context/virtual-drive/files/domain/File';
import { CreateFileDto } from '../../../../infra/drive-server/out/dto';
import { createFile } from '../../../../infra/drive-server/services/files/services/create-file';

export type CreateFileToBackendParams = {
  contentsId: string;
  filePath: string;
  size: number;
  folderId: number;
  folderUuid: string;
  bucket: string;
};

function extractName(filePath: string): string {
  const base = path.posix.basename(filePath);
  const { name } = path.posix.parse(base);
  return name;
}

function extractExtension(filePath: string): string {
  const base = path.posix.basename(filePath);
  const { ext } = path.posix.parse(base);
  return ext.slice(1);
}
export async function createFileToBackend({
  contentsId,
  filePath,
  size,
  folderId,
  folderUuid,
  bucket,
}: CreateFileToBackendParams): Promise<Result<File, DriveDesktopError>> {
  const plainName = extractName(filePath);
  const extension = extractExtension(filePath);

  const body: CreateFileDto = {
    bucket,
    fileId: undefined,
    encryptVersion: EncryptionVersion.Aes03,
    folderUuid,
    size,
    plainName,
    type: extension,
  };

  if (size > 0) {
    body.fileId = contentsId;
  }

  const response = await createFile(body);

  if (response.data) {
    const file = File.create({
      id: response.data.id,
      uuid: response.data.uuid,
      contentsId,
      folderId,
      createdAt: response.data.createdAt,
      modificationTime: response.data.modificationTime,
      path: filePath,
      size,
      updatedAt: response.data.updatedAt,
    });

    return { data: file };
  }

  const causeMap: Record<string, SyncError> = {
    CONFLICT: 'FILE_ALREADY_EXISTS',
    SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    TOO_MANY_REQUESTS: 'RATE_LIMITED',
    FILE_TOO_BIG: 'FILE_TOO_BIG',
  };

  const cause = causeMap[response.error.cause] ?? 'UNKNOWN';

  return {
    error: new DriveDesktopError(cause, response.error.message ?? `Creating file ${plainName} failed`),
  };
}
