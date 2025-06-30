import { getCheckpoint } from './sync-items-by-checkpoint/get-checkpoint';
import { syncItemsByFolder } from './sync-items-by-folder/sync-items-by-folder';

export const RemoteSyncModule = {
  syncItemsByFolder,
  getCheckpoint,
};
