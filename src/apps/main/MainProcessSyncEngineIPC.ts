import { ipcMain } from 'electron';
import { CustomIpc } from '../shared/IPC/IPCs';
import { MainProcessSyncEngineEvents } from '../shared/IPC/events/main/syncEngine';
import { BackgroundProcessSyncEngineEvents } from '../shared/IPC/events/background/syncEngine/synEngine';

export type MainProcessSyncEngineIPC = CustomIpc<
  MainProcessSyncEngineEvents,
  BackgroundProcessSyncEngineEvents
>;

export const MainProcessSyncEngineIPC =
  ipcMain as unknown as MainProcessSyncEngineIPC;
