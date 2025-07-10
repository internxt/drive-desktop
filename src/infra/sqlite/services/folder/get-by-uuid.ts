import { folderRepository } from '../drive-folder';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { Folder } from '@/context/virtual-drive/folders/domain/Folder';
import { logger } from '@/apps/shared/logger/logger';
import { SingleItemError } from '../common/single-item-error';

type Props = {
  uuid: string;
};

export async function getByUuid({ uuid }: Props) {
  try {
    const data = await folderRepository.findOne({ where: { uuid } });

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

    return { error: new SingleItemError('NOT_FOUND') };
  } catch (exc) {
    logger.error({
      msg: 'Error getting folder by uuid',
      uuid,
      exc,
    });

    return { error: new SingleItemError('UNKNOWN', exc) };
  }
}
