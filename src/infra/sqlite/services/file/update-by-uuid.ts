import { logger } from '@/apps/shared/logger/logger';
import { fileRepository } from '../drive-file';
import { SingleItemError } from '../common/single-item-error';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { DriveFile } from '@/apps/main/database/entities/DriveFile';

type Props = {
  uuid: string;
  payload: {
    name?: string;
    extension?: string;
    parentUuid?: FolderUuid;
    status?: DriveFile['status'];
  };
};

export async function updateByUuid({ uuid, payload }: Props) {
  try {
    const match = await fileRepository.update(
      { uuid },
      {
        plainName: payload.name,
        type: payload.extension,
        folderUuid: payload.parentUuid,
        status: payload.status,
      },
    );

    if (!match.affected) {
      return { error: new SingleItemError('NOT_FOUND') };
    }

    return { data: match.affected };
  } catch (exc) {
    logger.error({
      msg: 'Error updating file by uuid',
      uuid,
      payload,
      exc,
    });

    return { error: new SingleItemError('UNKNOWN', exc) };
  }
}
