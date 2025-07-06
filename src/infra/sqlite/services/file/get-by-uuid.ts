import { getUserOrThrow } from '@/apps/main/auth/service';
import { repository } from '../drive-file';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { fileDecryptName } from '@/context/virtual-drive/files/domain/file-decrypt-name';

export class GetByError extends Error {
  constructor(
    public readonly code: 'UNKNOWN' | 'NOT_FOUND',
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

export async function getByUuid({ uuid }: { uuid: string }) {
  try {
    const user = getUserOrThrow();
    const data = await repository.findOne({
      where: { uuid, userUuid: user.uuid },
    });

    if (data) {
      const { name, nameWithExtension } = fileDecryptName({
        encryptedName: data.name,
        parentId: data.folderId,
        extension: data.type,
        plainName: data.plainName,
      });

      return {
        data: {
          name,
          nameWithExtension,
          extension: data.type,
          contentsId: data.fileId,
          size: data.size,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } satisfies ExtendedDriveFile,
      };
    }

    return { error: new GetByError('NOT_FOUND') };
  } catch (exc) {
    return { error: new GetByError('UNKNOWN', exc) };
  }
}
