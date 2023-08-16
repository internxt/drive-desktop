import { ipcMain } from 'electron';
import { DriveEvents } from '../../shared/IPC/events/drive';
import { CustomIpc } from '../../shared/IPC/IPCs';
import { NoEvents } from './NoEvents';

export type IpcMainDrive = CustomIpc<NoEvents, DriveEvents>;

export const ipcMainDrive = ipcMain as unknown as IpcMainDrive;
