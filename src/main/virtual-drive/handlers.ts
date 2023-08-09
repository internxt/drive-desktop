import { VirtualDriveStatus } from '../../shared/types/VirtualDriveStatus';
import { ipcMainVirtualDrive } from '../ipcs/mainVirtualDrive';
import Logger from 'electron-log';

let lastVirtualDriveStatus: VirtualDriveStatus = VirtualDriveStatus.MOUNTING;

ipcMainVirtualDrive.handle(
  'get-virtual-drive-status',
  () => lastVirtualDriveStatus
);

ipcMainVirtualDrive.on('VIRTUAL_DRIVE_STARTING', () => {
  lastVirtualDriveStatus = VirtualDriveStatus.MOUNTING;
  Logger.info('VIRTUAL_DRIVE_STARTING');
});

ipcMainVirtualDrive.on('VIRTUAL_DRIVE_MOUNTED_SUCCESSFULLY', () => {
  lastVirtualDriveStatus = VirtualDriveStatus.MOUNTED;
  Logger.info('VIRTUAL_DRIVE_MOUNTED_SUCCESSFULLY');
});

ipcMainVirtualDrive.on('VIRTUAL_DRIVE_MOUNT_ERROR', (_, err: Error) => {
  Logger.info('VIRTUAL_DRIVE_MOUNT_ERROR', err.message);
  lastVirtualDriveStatus = VirtualDriveStatus.FAILED_TO_MOUNT;
});

ipcMainVirtualDrive.on('VIRTUAL_DRIVE_UNMOUNT_ERROR', (_, err: Error) => {
  Logger.info('VIRTUAL_DRIVE_UNMOUNT_ERROR', err.message);
});
