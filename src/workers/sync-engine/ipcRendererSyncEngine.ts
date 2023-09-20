import { ipcRenderer } from 'electron';
import { FromProcess, FromMain } from '../../shared/IPC/events/sync-engine';
import { CustomIpc } from '../../shared/IPC/IPCs';

export type SyncEngineIpc = CustomIpc<FromProcess, FromMain>;

export const ipcRendererSyncEngine = ipcRenderer as unknown as SyncEngineIpc;
