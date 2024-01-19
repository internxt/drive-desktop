import { ipcMain } from 'electron';
import { NoEvents } from '../../shared/IPC/events/NoEvents';
import { CustomIpc } from '../../shared/IPC/IPCs';
import { FromMain } from '../../shared/IPC/events/sync-engine';

export type VirtualDriveIPC = CustomIpc<NoEvents, FromMain>;

export const MainVirtualDriveIPC = ipcMain as unknown as VirtualDriveIPC;
