import { CustomIpc } from '../shared/IPC/IPCs';
import { FromProcess, FromMain } from '../shared/IPC/events/sync-engine';
import { ipcRenderer } from 'electron';

export type SyncEngineIpc = CustomIpc<FromProcess, FromMain>;

export const ipcRendererSyncEngine = ipcRenderer as unknown as SyncEngineIpc;
