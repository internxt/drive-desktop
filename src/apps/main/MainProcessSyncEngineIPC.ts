import { ipcMain } from 'electron';
import { TypedIPC } from '../shared/IPC/IPCs';
import { MainProcessVirtualDriveEvents } from '../shared/IPC/events/virtualDrive/MainProcessVirtualDriveEvents';
import { BackgroundProcessVirtualDriveEvents } from '../shared/IPC/events/virtualDrive/BackgroundProcessVirtualDriveEvents';

export type MainProcessSyncEngineIPC = TypedIPC<
  MainProcessVirtualDriveEvents,
  BackgroundProcessVirtualDriveEvents
>;

export const MainProcessSyncEngineIPC =
  ipcMain as unknown as MainProcessSyncEngineIPC;
