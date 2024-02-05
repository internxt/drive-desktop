import { TypedIPC } from '../shared/IPC/IPCs';
import { BackgroundProcessVirtualDriveEvents } from '../shared/IPC/events/virtualDrive/BackgroundProcessVirtualDriveEvents';
import { MainProcessVirtualDriveEvents } from '../shared/IPC/events/virtualDrive/MainProcessVirtualDriveEvents';
import { ipcRenderer } from 'electron';

export type SyncEngineIpc = TypedIPC<
  BackgroundProcessVirtualDriveEvents,
  MainProcessVirtualDriveEvents
>;

export const SyncEngineIPC = ipcRenderer as unknown as SyncEngineIpc;
