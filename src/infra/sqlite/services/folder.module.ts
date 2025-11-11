import { getByUuid } from './folder/get-by-uuid';
import { updateByUuid } from './folder/update-by-uuid';
import { createOrUpdate } from './folder/create-or-update';
import { getByName } from './folder/get-by-name';
import { getByWorkspaceId } from './folder/get-by-workspace-id';
import { createOrUpdateBatch } from './folder/create-or-update-batch';
import { getBetweenUuids } from './folder/get-between-uuids';

export const FolderModule = {
  getByName,
  getByUuid,
  getBetweenUuids,
  getByWorkspaceId,
  createOrUpdate,
  createOrUpdateBatch,
  updateByUuid,
};
