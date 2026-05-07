import { logger } from '@/apps/shared/logger/logger';
import { db } from '../../migrations/run-migrations';
import { DriveFolder } from '../../schema';
import { parseData } from './parse-data';
import { upsertQuery } from './queries';

type Props = {
  folder: DriveFolder;
};

export function createOrUpdate({ folder }: Props) {
  try {
    db.prepare(upsertQuery).run({
      uuid: folder.uuid,
      id: folder.id,
      workspaceId: folder.workspaceId,
      parentId: folder.parentId,
      parentUuid: folder.parentUuid,
      userUuid: folder.userUuid,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      plainName: folder.plainName,
      status: folder.status,
    });

    return parseData({ data: folder });
  } catch (error) {
    logger.error({ msg: 'Error creating or updating folder', folder, error });
  }
}
