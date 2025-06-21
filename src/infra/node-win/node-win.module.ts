import { getFileIdentity } from './services/item-identity/get-file-identity';
import { getFolderIdentity } from './services/item-identity/get-folder-identity';
import { getFileUuid } from './services/item-identity/get-file-uuid';
import { getFolderUuid } from './services/item-identity/get-folder-uuid';

export const NodeWin = {
  getFileIdentity,
  getFileUuid,
  getFolderIdentity,
  getFolderUuid,
};
