import { ipcMain } from 'electron';
import { NoEvents } from './NoEvents';
import { CustomIpc } from '../../shared/IPC/IPCs';
import { DriveEvents } from '../../shared/IPC/events/drive';

export type IpcMainDrive = CustomIpc<NoEvents, DriveEvents>;

export const ipcMainDrive = ipcMain as unknown as IpcMainDrive;
