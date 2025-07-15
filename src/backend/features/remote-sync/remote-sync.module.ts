import { deleteItemPlaceholders } from './file-explorer/delete-item-placeholders';
import { getCheckpoint } from './sync-items-by-checkpoint/get-checkpoint';
import { loadInMemoryPaths } from './sync-items-by-checkpoint/load-in-memory-paths';
import { syncItemsByFolder } from './sync-items-by-folder/sync-items-by-folder';

export const RemoteSyncModule = {
  syncItemsByFolder,
  getCheckpoint,
  loadInMemoryPaths,
  FileExplorerModule: {
    deleteItemPlaceholders,
  },
};
