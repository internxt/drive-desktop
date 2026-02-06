import { getFileInfo } from './services/get-file-info';
import { getFolderInfo } from './services/get-folder-info';
import { registerSyncRoot } from './services/register-sync-root';

export const NodeWin = {
  registerSyncRoot,
  getFileInfo,
  getFolderInfo,
};
