import { CustomIpc } from '@/apps/shared/IPC/IPCs';
import { ipcRenderer } from 'electron';
import { FromMain, FromProcess } from './ipc';

export const ipcRendererDriveServerWip = ipcRenderer as unknown as CustomIpc<FromProcess, FromMain>;
