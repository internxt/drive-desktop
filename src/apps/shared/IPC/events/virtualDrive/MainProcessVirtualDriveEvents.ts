import { DriveFile } from '../../../../main/database/entities/DriveFile';
import { DriveFolder } from '../../../../main/database/entities/DriveFolder';

type TreeEvents = {
  GET_UPDATED_REMOTE_ITEMS: () => Promise<{
    files: DriveFile[];
    folders: DriveFolder[];
  }>;
};

export type MainProcessVirtualDriveEvents = TreeEvents;
