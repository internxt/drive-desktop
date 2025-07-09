import { repository } from '../drive-folder';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { Folder } from '@/context/virtual-drive/folders/domain/Folder';
import { logger } from '@/apps/shared/logger/logger';

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
      const name = Folder.decryptName({
        name: data.name,
        parentId: data.parentId,
        plainName: data.plainName,
      });

      return {
        data: {
          name,
          parentUuid: data.parentUuid,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } satisfies SimpleDriveFolder,
      };
    }

    return { error: new GetByError('NOT_FOUND') };
  } catch (exc) {
    logger.error({
      msg: 'Error getting folder by uuid',
      uuid,
      exc,
    });

    return { error: new GetByError('UNKNOWN', exc) };
  }
}
