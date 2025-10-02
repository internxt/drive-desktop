import { logger } from '@/apps/shared/logger/logger';
import { folderRepository } from '../drive-folder';
import { DriveFolder, FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SingleItemError } from '../common/single-item-error';

type Props = {
  uuid: FolderUuid;
  payload: {
    name?: string;
    parentUuid?: FolderUuid;
    status?: DriveFolder['status'];
  };
};

export async function updateByUuid({ uuid, payload }: Props) {
  try {
    const match = await folderRepository.update(
      { uuid },
      {
        plainName: payload.name,
        parentUuid: payload.parentUuid,
        status: payload.status,
      },
    );

    if (!match.affected) {
      return { error: new SingleItemError('NOT_FOUND') };
    }

    return { data: match.affected };
  } catch (exc) {
    logger.error({
      msg: 'Error updating folder by uuid',
      uuid,
      payload,
      exc,
    });

    return { error: new SingleItemError('UNKNOWN', exc) };
  }
}
