import { getByUuid } from './folder/get-by-uuid';
import { updateByUuid } from './folder/update-by-uuid';
import { getByName } from './folder/get-by-name';

export const FolderModule = {
  getByName,
  getByUuid,
  updateByUuid,
};
