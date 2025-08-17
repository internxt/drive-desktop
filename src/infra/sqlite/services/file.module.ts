import { createOrUpdate } from './file/create-or-update';
import { getByName } from './file/get-by-name';
import { getByUuid } from './file/get-by-uuid';
import { getByUuids } from './file/get-by-uuids';
import { updateByUuid } from './file/update-by-uuid';

export const FileModule = {
  getByName,
  getByUuid,
  getByUuids,
  createOrUpdate,
  updateByUuid,
};
