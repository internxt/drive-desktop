import { repository } from '../drive-file';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { logger } from '@/apps/shared/logger/logger';
import { fileDecryptName } from '@/context/virtual-drive/files/domain/file-decrypt-name';

export class GetByError extends Error {
  constructor(
    public readonly code: 'UNKNOWN' | 'NOT_FOUND',
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

type Props = {
  uuid: string;
};

export async function getByUuid({ uuid }: Props) {
  try {
    const data = await repository.findOne({ where: { uuid } });

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
          parentUuid: data.folderUuid,
          contentsId: data.fileId,
          size: data.size,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } satisfies SimpleDriveFile,
      };
    }

    return { error: new GetByError('NOT_FOUND') };
  } catch (exc) {
    logger.error({
      msg: 'Error getting file by uuid',
      uuid,
      exc,
    });

    return { error: new GetByError('UNKNOWN', exc) };
  }
}
