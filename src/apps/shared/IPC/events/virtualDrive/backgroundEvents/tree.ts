import { DriveFile } from '../../../../../main/database/entities/DriveFile';
import { DriveFolder } from '../../../../../main/database/entities/DriveFolder';

type TreeError = {
  error: 'DUPLICATED_NODE';
  name: string; // Name of the affected node
};

export type TreeEvents = {
  TREE_BUILD_ERROR: (payload: TreeError) => void;

  // invocable
  GET_UPDATED_REMOTE_ITEMS: () => Promise<{
    files: DriveFile[];
    folders: DriveFolder[];
  }>;
};
