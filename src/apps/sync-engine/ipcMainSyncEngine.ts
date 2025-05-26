import { CustomIpc } from '../shared/IPC/IPCs';
import { FromProcess, FromMain } from '../shared/IPC/events/sync-engine';
import { ipcMain } from 'electron';

export type SyncEngineIpc = CustomIpc<FromMain, FromProcess>;
export const ipcMainSyncEngine = ipcMain as unknown as SyncEngineIpc;
