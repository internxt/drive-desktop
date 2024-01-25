import { CustomIpc } from '../shared/IPC/IPCs';
import { FromProcess, FromMain } from '../shared/IPC/events/sync-engine';
import { ipcRenderer } from 'electron';

export type FuseIpc = CustomIpc<FromProcess, FromMain>;

export const ipcRenderFuse = ipcRenderer as unknown as FuseIpc;
