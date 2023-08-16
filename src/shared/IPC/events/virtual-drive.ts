import { VirtualDriveStatus } from '../../../shared/types/VirtualDriveStatus';

export type VirtualDriveEvents = {
  VIRTUAL_DRIVE_RETRYING_MOUNT: () => void;
  VIRTUAL_DRIVE_STARTING: () => void;
  VIRTUAL_DRIVE_MOUNTED_SUCCESSFULLY: () => void;
  VIRTUAL_DRIVE_MOUNT_ERROR: (err: Error) => void;
  VIRTUAL_DRIVE_UNMOUNT_ERROR: (err: Error) => void;
};

export type VirtualDriveHandlers = {
  'get-virtual-drive-status': () => VirtualDriveStatus;
};
