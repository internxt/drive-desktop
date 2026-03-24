import { createOrUpdate } from './file/create-or-update';
import { createOrUpdateBatch } from './file/create-or-update-batch';
import { getBetweenUuids } from './file/get-between-uuids';
import { getByName } from './file/get-by-name';
import { getByUuid } from './file/get-by-uuid';
import { getByWorkspaceId } from './file/get-by-workspace-id';
import { updateByUuid } from './file/update-by-uuid';

export const FileModule = {
  getByName,
  getByUuid,
  getBetweenUuids,
  getByWorkspaceId,
  createOrUpdate,
  createOrUpdateBatch,
  updateByUuid,
};
