import { ipcMain } from 'electron';
import {
  VirtualDriveHandlers,
  VirtualDriveEvents,
} from '../../shared/IPC/events/virtual-drive';
import { CustomIpc } from '../../shared/IPC/IPCs';
import { NoEvents } from './NoEvents';

export type IpcVirtualDrive = CustomIpc<
  NoEvents,
  VirtualDriveEvents & VirtualDriveHandlers
>;

export const ipcMainVirtualDrive = ipcMain as unknown as IpcVirtualDrive;
