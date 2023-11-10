import { ipcMain } from 'electron';
import { FromProcess, FromMain } from '../../shared/IPC/events/sync-engine';
import { CustomIpc } from '../../shared/IPC/IPCs';

export const ipcMainSyncEngine = ipcMain as unknown as CustomIpc<
  FromMain,
  FromProcess
>;
