import { CustomIpc } from '../shared/IPC/IPCs';
import { BackgroundProcessSyncEngineEvents } from '../shared/IPC/events/background/syncEngine/synEngine';
import { MainProcessSyncEngineEvents } from '../shared/IPC/events/main/syncEngine';
import { ipcRenderer } from 'electron';

export type SyncEngineIpc = CustomIpc<
  BackgroundProcessSyncEngineEvents,
  MainProcessSyncEngineEvents
>;

export const SyncEngineIPC = ipcRenderer as unknown as SyncEngineIpc;
