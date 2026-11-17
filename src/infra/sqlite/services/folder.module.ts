import { createOrUpdate } from './folder/create-or-update';
import { createOrUpdateBatch } from './folder/create-or-update-batch';
import { getBetweenUuids } from './folder/get-between-uuids';
import { getByName } from './folder/get-by-name';
import { getByUuid } from './folder/get-by-uuid';
import { getFoldersByUuids } from './folder/get-folders-by-uuids';
import { updateByUuid } from './folder/update-by-uuid';

export const FolderModule = {
  getByName,
  getByUuid,
  getFoldersByUuids,
  getBetweenUuids,
  createOrUpdate,
  createOrUpdateBatch,
  updateByUuid,
};
