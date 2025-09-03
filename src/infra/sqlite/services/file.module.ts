import { createOrUpdate } from './file/create-or-update';
import { getByName } from './file/get-by-name';
import { getByParentUuid } from './file/get-by-parent-uuid';
import { getByUuid } from './file/get-by-uuid';
import { getByWorkspaceId } from './file/get-by-workspace-id';
import { updateByUuid } from './file/update-by-uuid';

export const FileModule = {
  getByName,
  getByUuid,
  getByParentUuid,
  getByWorkspaceId,
  createOrUpdate,
  updateByUuid,
};
