import { createOrUpdate } from './file/create-or-update';
import { getByName } from './file/get-by-name';
import { getByUuid } from './file/get-by-uuid';
import { updateByUuid } from './file/update-by-uuid';

export const FileModule = {
  getByName,
  getByUuid,
  createOrUpdate,
  updateByUuid,
};
