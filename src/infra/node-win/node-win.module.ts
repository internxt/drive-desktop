import { getFileIdentity } from './services/item-identity/get-file-identity';
import { getFolderIdentity } from './services/item-identity/get-folder-identity';
import { getFileUuid } from './services/item-identity/get-file-uuid';
import { getFileUuidFromPlaceholder } from './services/item-identity/get-file-uuid';
import { getFolderUuid } from './services/item-identity/get-folder-uuid';
import { getFileInfo } from './services/item-identity/get-file-info';
import { getFolderInfo } from './services/item-identity/get-folder-info';

export const NodeWin = {
  getFileIdentity,
  getFileUuid,
  getFileUuidFromPlaceholder,
  getFolderIdentity,
  getFolderUuid,
  getFileInfo,
  getFolderInfo,
};
