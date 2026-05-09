import { createOrUpdate } from './folder/create-or-update';
import { createOrUpdateBatch } from './folder/create-or-update-batch';
import { getBetweenUuids } from './folder/get-between-uuids';
import { getByName } from './folder/get-by-name';
import { getByParentUuid } from './folder/get-by-parent-uuid';
import { getByUuid } from './folder/get-by-uuid';
import { getByWorkspaceId } from './folder/get-by-workspace-id';
import { updateByUuid } from './folder/update-by-uuid';

export const FolderModule = {
  getByName,
  getByUuid,
  getBetweenUuids,
  getByParentUuid,
  getByWorkspaceId,
  createOrUpdate,
  createOrUpdateBatch,
  updateByUuid,
};
