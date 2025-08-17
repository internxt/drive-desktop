import { getByUuid } from './folder/get-by-uuid';
import { updateByUuid } from './folder/update-by-uuid';
import { createOrUpdate } from './folder/create-or-update';
import { getByName } from './folder/get-by-name';
import { getByUuids } from './folder/get-by-uuids';

export const FolderModule = {
  getByName,
  getByUuid,
  getByUuids,
  createOrUpdate,
  updateByUuid,
};
