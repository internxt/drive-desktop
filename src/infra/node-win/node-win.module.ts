import { getFileInfo } from './services/item-identity/get-file-info';
import { getFileUuidFromPlaceholder } from './services/item-identity/get-file-uuid-from-placeholder';
import { getFolderInfo } from './services/item-identity/get-folder-info';

export const NodeWin = {
  getFileUuidFromPlaceholder,
  getFileInfo,
  getFolderInfo,
};
