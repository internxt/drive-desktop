import { VirtualDriveStatus } from '../../shared/types/VirtualDriveStatus';
import { ipcMainVirtualDrive } from '../ipcs/mainVirtualDrive';
import Logger from 'electron-log';

let lastVirtualDriveStatus: VirtualDriveStatus = VirtualDriveStatus.READY;

ipcMainVirtualDrive.handle(
  'get-virtual-drive-status',
  () => lastVirtualDriveStatus
);

ipcMainVirtualDrive.on('VIRTUAL_DRIVE_STARTING', () => {
  lastVirtualDriveStatus = VirtualDriveStatus.READY;
  Logger.info('VIRTUAL_DRIVE_STARTING');
});

ipcMainVirtualDrive.on('VIRTUAL_DRIVE_UNMOUNT_ERROR', (_, err: Error) => {
  Logger.info('VIRTUAL_DRIVE_UNMOUNT_ERROR', err.message);
});
