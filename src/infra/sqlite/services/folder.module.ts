import { getByUuid } from './folder/get-by-uuid';
import { updateByUuid } from './folder/update-by-uuid';
import { createOrUpdate } from './folder/create-or-update';
import { getByName } from './folder/get-by-name';
import { getByParentUuid } from './folder/get-by-parent-uuid';
import { getByWorkspaceId } from './folder/get-by-workspace-id';
import { createOrUpdateBatch } from './folder/create-or-update-batch';

export const FolderModule = {
  getByName,
  getByUuid,
  getByParentUuid,
  getByWorkspaceId,
  createOrUpdate,
  createOrUpdateBatch,
  updateByUuid,
};
